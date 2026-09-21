import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, explorer, catalog, proxy, header, footer] = await Promise.all([
  readFile(new URL("../src/app/documentacao/page.tsx", import.meta.url), "utf8"),
  readFile(
    new URL("../src/components/documentation/EndpointExplorer.tsx", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../src/lib/documentation/backend-catalog.ts", import.meta.url),
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
