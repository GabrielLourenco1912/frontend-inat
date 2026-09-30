import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(relativePath) {
  const source = readFileSync(new URL(`../src/${relativePath}.ts`, import.meta.url), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInThisContext(`(function(exports) { ${javascript}\n})`)(exports);
  return exports;
}

const { digitsOnly, phoneDigits, formatMaskedInput, parseSalary, formatSalary } = load("lib/inputs/masks");
const { filterDetailItems } = load("lib/detail-filter");

test("documentos, CEP e telefones aparecem formatados e saem sem pontuação", () => {
  assert.equal(formatMaskedInput("cpf", "12345678901"), "123.456.789-01");
  assert.equal(formatMaskedInput("cnpj", "12345678000199"), "12.345.678/0001-99");
  assert.equal(formatMaskedInput("postalCode", "83200000"), "83200-000");
  assert.equal(formatMaskedInput("phone", "41999999999"), "(41) 99999-9999");
  assert.equal(formatMaskedInput("phone", "4133334444"), "(41) 3333-4444");
  assert.equal(digitsOnly("123.456.789-01"), "12345678901");
  assert.equal(phoneDigits("+55 (41) 99999-9999"), "41999999999");
});

test("salário aceita vírgula brasileira e mantém dois centavos na exibição", () => {
  assert.equal(parseSalary("1.069,48"), 1069.48);
  assert.equal(parseSalary("1069,48"), 1069.48);
  assert.equal(parseSalary("1069.48"), 1069.48);
  assert.equal(formatSalary(1069), "1.069,00");
  assert.equal(formatSalary("1.069,48"), "1.069,48");
  assert.ok(Number.isNaN(parseSalary("abc")));
});

test("busca interna ignora acentos e combina o termo com o filtro", () => {
  const items = [
    { name: "João de Paranaguá", status: "ACTIVE" },
    { name: "Joana de Curitiba", status: "INACTIVE" },
    { name: "Pedro de Paranaguá", status: "INACTIVE" },
  ];
  assert.deepEqual(filterDetailItems(items, "paranagua", (item) => item.name).map((item) => item.name), ["João de Paranaguá", "Pedro de Paranaguá"]);
  assert.deepEqual(filterDetailItems(items, "paranagua", (item) => item.name, (item) => item.status === "ACTIVE").map((item) => item.name), ["João de Paranaguá"]);
});
