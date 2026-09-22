import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, explorer, catalog, contracts, proxy, header, footer] = await Promise.all([
  readFile(new URL("../src/app/documentacao/page.tsx", import.meta.url), "utf8"),
  readFile(
    new URL("../src/components/documentation/EndpointExplorer.tsx", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../src/lib/documentation/backend-catalog.ts", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../src/lib/documentation/request-contracts.ts", import.meta.url),
    "utf8",
  ),
  readFile(new URL("../src/proxy.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/landing/Header.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/landing/Footer.tsx", import.meta.url), "utf8"),
]);

test("a documentação é uma página pública e independente do backend", () => {
  assert.match(page, /export default function DocumentationPage/);
  assert.match(page, /<EndpointExplorer \/>/);
  assert.doesNotMatch(page, /backendFetch|getCurrentUser|cookies\(|headers\(/);
  assert.match(proxy, /matcher:\s*\["\/sistema\/:path\*"\]/);
  assert.doesNotMatch(proxy, /documentacao/);
});

test("a landing page expõe a rota de documentação", () => {
  assert.match(header, /href="\/documentacao"/);
  assert.match(footer, /href="\/documentacao"/);
});

test("o explorador oferece busca e filtros sobre um catálogo versionado", () => {
  assert.match(explorer, /type="search"/);
  assert.match(explorer, /setAccess/);
  assert.match(explorer, /setActiveGroup/);
  assert.match(catalog, /export const apiGroups/);
  assert.match(catalog, /export const backendModules/);
  assert.match(catalog, /publicEndpointCount/);
});

test("cada detalhe de endpoint documenta o consumo HTTP", () => {
  assert.match(explorer, /Cabeçalhos da requisição/);
  assert.match(explorer, /Payload esperado/);
  assert.match(explorer, /Exemplo com curl/);
  assert.match(explorer, /Authorization/);
  assert.match(explorer, /X-Client-Type/);
  assert.match(explorer, /Parâmetros de rota/);
  assert.match(contracts, /export const requestContracts/);
  assert.match(contracts, /ContactMessageDtos\.CreateRequest/);
  assert.match(contracts, /multipart\/form-data|Partes multipart|metadata/);
});

test("todo DTO de entrada do catálogo possui payload documentado", () => {
  const explicitContracts = [...catalog.matchAll(/request:\s*"([^"]+)"/g)].map(
    ([, contract]) => contract,
  );
  const generatedCrudContracts = [
    "UserDtos.UpdateRequest",
    "RoleDtos.Request",
    "PersonDtos.Request",
    "OrganizationDtos.Request",
    "OrganizationMembershipDtos.Request",
    "ContractDtos.Request",
    "DocumentTypeDtos.Request",
    "CohortDtos.Request",
    "CohortEnrollmentDtos.Request",
  ];

  for (const contract of new Set([...explicitContracts, ...generatedCrudContracts])) {
    const quotedKey = `${JSON.stringify(contract)}: {`;
    const identifierKey = `  ${contract}: {`;
    assert.ok(
      contracts.includes(quotedKey) || contracts.includes(identifierKey),
      `Contrato sem payload documentado: ${contract}`,
    );
  }
});
