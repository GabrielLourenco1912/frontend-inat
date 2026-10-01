import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const dependency = createRequire(import.meta.url);

function loader(overrides) {
  const cache = new Map();
  function load(id) {
    if (id in overrides) return overrides[id];
    if (!id.startsWith("@/")) return dependency(id);
    if (cache.has(id)) return cache.get(id);
    const base = fileURLToPath(new URL(`../src/${id.slice(2)}`, import.meta.url));
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

function elements(element) {
  if (!element || typeof element !== "object") return [];
  const children = element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(elements)];
}

const lesson = { id: "lesson-id", title: "Cidadania", description: "Objetivos e orientações", status: "SCHEDULED" };

test("a página carrega materiais para o aprendiz sem consultar a chamada administrativa", async () => {
  const paths = [];
  const load = loader({
    "@/components/portal/LessonWorkspace": { LessonWorkspace: "LessonWorkspace" },
    "@/lib/auth/session": { requireCapability: async () => ({ roles: ["LEARNER"], learnerId: "learner-id", isActive: true }) },
    "@/lib/api/server": {
      serverApiGetOrNull: async () => lesson,
      serverApiGet: async (path) => { paths.push(path); return path.endsWith("/files") ? [{ lessonId: lesson.id, file: { id: "material-id" } }] : []; },
    },
  });
  const page = await load("@/app/sistema/aulas/[lessonId]/page").default({ params: Promise.resolve({ lessonId: lesson.id }) });
  assert.equal(page.props.canManage, false);
  assert.equal(page.props.lessonFiles[0].file.id, "material-id");
  assert.deepEqual(paths.sort(), [`/api/activities/lesson/${lesson.id}`, `/api/lessons/${lesson.id}/files`].sort());
});

test("materiais mantêm download para o aprendiz e remoção apenas para quem gerencia a aula", () => {
  const load = loader({
    react: { useRef: () => ({ current: false }), useState: (initial) => [initial, () => {}] },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@/components/portal/AttachmentFileList": { AttachmentFileList: "AttachmentFileList" },
    "@/components/design-system/Icon": { Icon: "Icon" },
    "@/components/design-system/PortalPrimitives": { Sheet: "Sheet", SectionHeading: "SectionHeading", EmptyState: "EmptyState" },
  });
  const { LessonMaterials } = load("@/components/portal/LessonMaterials");
  const files = [{ file: { id: "material-id" }, sortOrder: 0 }];
  for (const canManage of [false, true]) {
    const view = elements(LessonMaterials({ lesson, files, canManage }));
    const list = view.find((element) => element.type === "AttachmentFileList");
    assert.equal(list.props.url("material-id"), "/api/backend/lessons/lesson-id/files/material-id/content");
    assert.equal(typeof list.props.onRemove === "function", canManage);
    assert.equal(!!view.find((element) => element.type === "SectionHeading").props.action, canManage);
  }
});

test("o upload envia metadados JSON e binário e mantém o formulário aberto em caso de falha", async () => {
  const requests = [];
  const errors = [];
  let refreshed = false;
  let closed = false;
  let state = 0;
  const load = loader({
    react: {
      useRef: () => ({ current: false }),
      useState: (initial) => {
        const index = state++;
        return [index === 0 ? true : initial, (value) => { if (index === 0 && !value) closed = true; if (index === 2) errors.push(value); }];
      },
    },
    "next/navigation": { useRouter: () => ({ refresh: () => { refreshed = true; } }) },
    "@/components/portal/AttachmentFileList": { AttachmentFileList: "AttachmentFileList" },
    "@/components/design-system/Icon": { Icon: "Icon" },
    "@/components/design-system/PortalPrimitives": { Sheet: "Sheet", SectionHeading: "SectionHeading", EmptyState: "EmptyState" },
    "@/lib/api/client": {
      apiRequest: async (url, options) => { requests.push({ url, ...options }); throw new Error("Falha no upload"); },
      requestErrorMessage: (error) => error.message,
    },
  });
  const { LessonMaterials } = load("@/components/portal/LessonMaterials");
  const form = elements(LessonMaterials({ lesson, files: [], canManage: true })).find((element) => element.type === "form");
  const fields = new FormData();
  fields.set("sortOrder", "3");
  fields.set("file", new File(["Material da aula"], "material.txt", { type: "text/plain" }));
  const NativeFormData = globalThis.FormData;
  globalThis.FormData = class extends NativeFormData {
    constructor(source) { super(); if (source) for (const [key, value] of source) this.append(key, value); }
  };
  try { await form.props.onSubmit({ preventDefault() {}, currentTarget: fields }); }
  finally { globalThis.FormData = NativeFormData; }
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "/api/backend/lessons/lesson-id/files");
  assert.equal(requests[0].method, "POST");
  assert.deepEqual(JSON.parse(await requests[0].body.get("metadata").text()), { sortOrder: 3 });
  assert.equal(requests[0].body.get("metadata").type, "application/json");
  assert.equal(requests[0].body.get("file").name, "material.txt");
  assert.equal(closed, false);
  assert.equal(refreshed, false);
  assert.ok(errors.includes("Falha no upload"));
});
