import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
const source = ts.transpileModule(readFileSync(new URL("../src/lib/api/time-zone.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInThisContext(`(function(exports) { ${source}\n})`)(exports);

const { parseSaoPauloDateTimeInput, saoPauloDateTimeInputValue } = exports;

test("UTC instants display as São Paulo wall times across midnight", () => {
  assert.equal(saoPauloDateTimeInputValue("2026-09-24T01:11:04Z"), "2026-09-23T22:11");
  assert.equal(parseSaoPauloDateTimeInput("2026-09-23T22:11").toISOString(), "2026-09-24T01:11:00.000Z");
});

test("invalid local times do not become different instants", () => {
  assert.equal(Number.isNaN(parseSaoPauloDateTimeInput("2026-02-30T10:00").getTime()), true);
  assert.equal(Number.isNaN(parseSaoPauloDateTimeInput("not-a-date").getTime()), true);
});
