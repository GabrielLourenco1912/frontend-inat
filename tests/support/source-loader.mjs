import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const dependency = createRequire(import.meta.url);

export function loader(overrides) {
  const cache = new Map();
  function load(id) {
    if (id in overrides) return overrides[id];
    if (!id.startsWith("@/")) return dependency(id);
    if (cache.has(id)) return cache.get(id);
    const base = fileURLToPath(new URL(`../../src/${id.slice(2)}`, import.meta.url));
    const filename = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
    assert.ok(filename, `Missing source: ${id}`);
    const exports = {};
    const source = ts.transpileModule(readFileSync(filename, "utf8"), {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    vm.runInThisContext(`(function(exports, require) { ${source}\n})`, { filename })(exports, load);
    cache.set(id, exports);
    return exports;
  }
  return load;
}

export function elements(element) {
  if (!element || typeof element !== "object") return [];
  const children = element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(elements)];
}
