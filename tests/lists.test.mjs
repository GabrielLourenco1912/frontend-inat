import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const requireDependency = createRequire(import.meta.url);
const modules = new Map();
function load(relativePath) {
  if (modules.has(relativePath)) return modules.get(relativePath);
  const filename = [".ts", ".tsx"].map((ext) => new URL(`../src/${relativePath}${ext}`, import.meta.url)).find(existsSync);
  assert.ok(filename, relativePath);
  const exports = {};
  modules.set(relativePath, exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const localRequire = (id) => {
    if (id === "next/link") return function TestLink({ children, ...props }) {
      delete props.prefetch;
      return createElement("a", props, children);
    };
    if (id === "@/components/design-system/Icon") return { Icon: ({ name }) => createElement("span", { "data-icon": name }) };
    return id.startsWith("@/") ? load(id.slice(2)) : requireDependency(id);
  };
  vm.runInThisContext(`(function(exports, require) { ${source}\n})`, { filename: filename.pathname })(exports, localRequire);
  return exports;
}

const { ExpiredDocumentList } = load("components/portal/ExpiredDocumentList");
const { ListPagination } = load("components/design-system/ListPagination");
const render = (component, props) => renderToStaticMarkup(createElement(component, props));

test("expired documents use the standard list chevron and owner deep links", () => {
  const html = render(ExpiredDocumentList, {
    page: { content: [{ id: "doc", personId: "person", documentTypeId: 1, expiresOn: "2025-01-01", file: { originalName: "identidade.pdf" } }], page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true },
    documentTypes: [{ id: 1, name: "Identidade" }],
    owners: [{ personId: "person", learnerId: "learner", name: "Aprendiz" }],
  });
  assert.match(html, /data-icon="chevron-right"/);
  assert.match(html, /\/sistema\/aprendizes\/learner\?tab=documentos&amp;document=doc/);
  assert.doesNotMatch(html, /Ver cadastro|data-icon="arrow-right"|aria-disabled|type="search"/);
  assert.match(html, /Página 1 de 1/);
  assert.doesNotMatch(html, /aria-label="Paginação da lista"/);
});

test("first page shows only the next action", () => {
  const html = render(ListPagination, { shown: 20, total: 300, totalPages: 15, nextHref: "?page=2" });
  assert.match(html, /Mostrando 20 de 300/);
  assert.match(html, /href="\?page=2"/);
  assert.doesNotMatch(html, /Página anterior|disabled/);
});

test("middle pages expose both valid destinations", () => {
  const html = render(ListPagination, { shown: 20, total: 300, page: 7, totalPages: 15, previousHref: "?page=7", nextHref: "?page=9" });
  assert.match(html, /Página 8 de 15/);
  assert.match(html, /href="\?page=7"/);
  assert.match(html, /href="\?page=9"/);
});

test("last page shows only the previous action", () => {
  const html = render(ListPagination, { shown: 20, total: 300, page: 14, totalPages: 15, previousHref: "?page=14" });
  assert.match(html, /Página 15 de 15/);
  assert.doesNotMatch(html, /Próxima página|disabled/);
});

test("empty lists have no disabled controls or page zero", () => {
  const html = render(ListPagination, { shown: 0, total: 0, totalPages: 0 });
  assert.match(html, /Mostrando 0 de 0/);
  assert.match(html, /Página 1 de 1/);
  assert.doesNotMatch(html, /<nav|disabled/);
});
