import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [backendDto, backendType, frontendDto, requestDocs, creator, editor, fields] = await Promise.all([
  readFile(new URL("../../backend/src/main/java/dev/lourencogabriel/inatead/organization/dto/OrganizationDtos.java", import.meta.url), "utf8"),
  readFile(new URL("../../backend/src/main/java/dev/lourencogabriel/inatead/shared/model/OrganizationType.java", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/api/domain-contracts.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/documentation/request-contracts.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/portal/ResourceCreators.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/portal/EntityEditors.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/portal/OrganizationTypeFields.tsx", import.meta.url), "utf8"),
]);

test("o contrato de organizações mantém os tipos do backend como coleção em toda a UI e documentação", () => {
  assert.match(backendDto, /@NotEmpty Set<@NotNull OrganizationType> organizationTypes/);
  assert.match(backendDto, /Set<OrganizationType> organizationTypes/);
  assert.match(frontendDto, /organizationTypes: OrganizationType\[\]/);
  assert.match(requestDocs, /organizationTypes: \["EMPLOYER", "SCHOOL"\]/);
  assert.match(requestDocs, /organizationTypes — obrigatório, ao menos um/);
  assert.match(creator, /form\.getAll\("organizationTypes"\)/);
  assert.match(editor, /form\.getAll\("organizationTypes"\)/);
  assert.match(fields, /name="organizationTypes"/);
  for (const content of [backendDto, frontendDto, requestDocs, creator, editor]) {
    assert.doesNotMatch(content, /\borganizationType\s*[:=(]/);
  }
});

test("as opções do formulário e o tipo do front seguem o catálogo do backend", () => {
  const enumBody = backendType.match(/enum OrganizationType\s*\{([^}]+)\}/s)?.[1];
  const frontendTypeBody = frontendDto.match(/export type OrganizationType = ([^;]+);/)?.[1];
  assert.ok(enumBody);
  assert.ok(frontendTypeBody);

  const backendCodes = [...enumBody.matchAll(/\b([A-Z][A-Z0-9_]*)\b/g)].map(([, code]) => code).sort();
  const frontendCodes = [...frontendTypeBody.matchAll(/"([A-Z][A-Z0-9_]*)"/g)].map(([, code]) => code).sort();
  const formCodes = [...fields.matchAll(/code: "([A-Z][A-Z0-9_]*)"/g)].map(([, code]) => code).sort();
  assert.deepEqual(frontendCodes, backendCodes);
  assert.deepEqual(formCodes, backendCodes);
});
