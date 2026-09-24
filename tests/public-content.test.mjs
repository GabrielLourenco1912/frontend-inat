import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const exports = {};
const constants = ts.transpileModule(source("src/lib/constants.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(constants, {
  exports,
  process: { env: {} },
  encodeURIComponent,
});

const { CONTACT_INFO, GOOGLE_MAPS_URL, INSTITUTION_ADDRESS, PUBLIC_DOCUMENTS } = exports;

test("regulamento e manual são PDFs públicos usados pelas páginas", () => {
  for (const url of Object.values(PUBLIC_DOCUMENTS)) {
    assert.match(url, /^\/documents\/[a-z-]+\.pdf$/);
    const pdf = readFileSync(new URL(`../public${url}`, import.meta.url));
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  }

  assert.match(source("src/components/auth/SignupForm.tsx"), /src=\{PUBLIC_DOCUMENTS\.regulation\}/);
  assert.match(source("src/components/landing/ForYouth.tsx"), /href=\{PUBLIC_DOCUMENTS\.apprenticeManual\}/);
  assert.doesNotMatch(source("src/app/criar-conta/page.tsx"), /REGULATION_URL/);
});

test("mapa e contatos usam os dados institucionais informados", () => {
  const map = new URL(GOOGLE_MAPS_URL);
  assert.equal(map.origin, "https://www.google.com");
  assert.equal(map.pathname, "/maps/search/");
  assert.equal(map.searchParams.get("api"), "1");
  assert.ok(map.searchParams.get("query")?.includes(INSTITUTION_ADDRESS));

  assert.equal(CONTACT_INFO.email, "contato@inat.org.br");
  assert.equal(CONTACT_INFO.phone, "+55 41 3425-8112");
  assert.equal(CONTACT_INFO.phoneHref, "tel:+554134258112");
  assert.equal(CONTACT_INFO.whatsappHref, "https://wa.me/554134258112");
  assert.equal(CONTACT_INFO.hours, "Segunda a sexta, 08:00–11:00 e 13:00–17:30");
});
