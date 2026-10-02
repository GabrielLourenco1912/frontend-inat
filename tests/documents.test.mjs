import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

// Execute the actual server pages against test-only API fixtures.
// UI components are placeholders; browser checks cover their interactions.
const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const testRoot = fileURLToPath(new URL("./", import.meta.url));
const requireDependency = createRequire(import.meta.url);
const modules = new Map();
const requests = [];
const componentStubs = new Proxy({}, { get: (_, name) => String(name) });

function load(relativePath) {
  const base = path.join(relativePath.startsWith("fixtures/") ? testRoot : sourceRoot, relativePath);
  const filename = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
  assert.ok(filename, `Missing test module: ${relativePath}`);
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const localRequire = (id) => {
    if (id === "server-only") return {};
    if (id.startsWith("@/components/")) return componentStubs;
    if (id === "@/lib/auth/session") return { requireCapability: async () => load("fixtures/backend-adapter").mockActor };
    if (id === "next/headers") return { cookies: async () => ({ get: () => ({ value: "test-access-token" }) }) };
    if (id === "@/lib/api/backend") return { backendFetch: async (url) => {
      const result = load("fixtures/backend-adapter").mockApiGet(url);
      return new Response(JSON.stringify({ data: result.data, message: result.message }), { status: result.status });
    } };
    if (id === "next/navigation") return {
      redirect: (url) => { throw Object.assign(new Error("Redirect"), { url }); },
      notFound: () => { throw new Error("Not found"); },
    };
    return id.startsWith("@/") ? load(id.slice(2)) : requireDependency(id);
  };
  vm.runInThisContext(`(function(exports, require) { ${source}\n})`, { filename })(exports, localRequire);
  if (relativePath === "lib/api/server") {
    for (const [name, implementation] of Object.entries(exports)) {
      if (name.startsWith("serverApi")) exports[name] = (...args) => {
        requests.push({ name, path: args[0] });
        return implementation(...args);
      };
    }
  }
  return exports;
}

const mock = load("fixtures/backend-adapter");
const navigation = load("lib/documents/navigation");
const ExpiredPage = load("app/sistema/documentos/page").default;
const PersonPage = load("app/sistema/pessoas/[personId]/page").default;
const LearnerPage = load("app/sistema/aprendizes/[learnerId]/page").default;
const ContractPage = load("app/sistema/contratos/[contractId]/page").default;
const documentRequests = () => requests.filter((request) => /\/api\/(person|contract)-documents/.test(request.path));

beforeEach(() => { requests.length = 0; });

test("expired documents are filtered and paginated before returning records", () => {
  const originalSize = mock.personDocuments.length;
  const expired = mock.personDocuments.find((document) => document.verificationStatus === "EXPIRED");
  const initialCount = mock.personDocuments.filter((document) => document.verificationStatus === "EXPIRED").length;
  try {
    for (let index = 0; index < 45; index++) {
      mock.personDocuments.push({ ...expired, id: `test-expired-${String(index).padStart(3, "0")}`, expiresOn: "2025-01-01" });
      mock.personDocuments.push({ ...expired, id: `test-verified-${index}`, verificationStatus: "VERIFIED" });
    }
    const first = mock.mockApiGet("/api/person-documents?verificationStatus=EXPIRED&page=0&size=20").data;
    const second = mock.mockApiGet("/api/person-documents?verificationStatus=EXPIRED&page=1&size=20").data;
    assert.equal(first.totalElements, initialCount + 45);
    assert.equal(first.totalPages, 3);
    assert.equal(first.content.length, 20);
    assert.equal(second.content.length, 20);
    assert.ok(first.content.every((document) => document.verificationStatus === "EXPIRED"));
    assert.equal(first.content[0].expiresOn, "2025-01-01");
    assert.equal(new Set([...first.content, ...second.content].map((document) => document.id)).size, 40);
  } finally {
    mock.personDocuments.splice(originalSize);
  }
});

test("person and verification filters intersect and unknown statuses are rejected", () => {
  const owner = mock.personDocuments[0].personId;
  const page = mock.mockApiGet(`/api/person-documents?personId=${owner}&verificationStatus=VERIFIED&size=1`).data;
  const expected = mock.personDocuments.filter((document) => document.personId === owner && document.verificationStatus === "VERIFIED");
  assert.equal(page.totalElements, expected.length);
  assert.ok(page.content.every((document) => document.personId === owner));
  assert.equal(mock.mockApiGet("/api/person-documents?verificationStatus=INVALID").status, 400);
  assert.equal(mock.mockApiGet("/api/person-documents?personId=missing").data.totalElements, 0);
});

test("contract filters never return files of another contract or personal documents", () => {
  const contract = mock.contractDocuments[0];
  const page = mock.mockApiGet(`/api/contract-documents?contractId=${contract.contractId}&size=1`).data;
  assert.equal(page.content.length, 1);
  assert.ok(page.content.every((document) => document.contractId === contract.contractId));
  assert.ok(page.content.every((document) => !mock.personDocuments.some((personal) => personal.file.id === document.file.id)));
  assert.equal(mock.documentTypes.find((type) => type.id === contract.documentTypeId).scope, "CONTRACT");
  assert.equal(mock.mockApiGet("/api/contract-documents?contractId=missing").data.totalElements, 0);
});

test("learner lookup is restricted to the document owner", () => {
  const learner = mock.learners[0];
  const page = mock.mockApiGet(`/api/learners?personId=${learner.personId}&size=1`).data;
  assert.equal(page.totalElements, 1);
  assert.equal(page.content[0].id, learner.id);
  assert.equal(mock.mockApiGet("/api/learners?personId=missing").data.totalElements, 0);
});

test("expired list requests one page and resolves only its owners and types", async () => {
  const result = await ExpiredPage({ searchParams: Promise.resolve({}) });
  assert.deepEqual(documentRequests(), [{ name: "serverApiPage", path: "/api/person-documents?verificationStatus=EXPIRED&page=0&size=20" }]);
  assert.equal(requests.some((request) => request.name === "serverApiAll"), false);
  assert.ok(result.props.page.content.every((document) => document.verificationStatus === "EXPIRED"));
  assert.equal(result.props.owners.length, new Set(result.props.page.content.map((document) => document.personId)).size);
  for (const owner of result.props.owners) {
    assert.ok(requests.some((request) => request.path === `/api/learners?personId=${encodeURIComponent(owner.personId)}&page=0&size=1`));
  }
});

test("expired list redirects out-of-range pages without loading every page", async () => {
  await assert.rejects(ExpiredPage({ searchParams: Promise.resolve({ page: "999" }) }), (error) => error.url === "/sistema/documentos?page=1");
  assert.equal(documentRequests().length, 1);
  assert.equal(requests.length, 1);
});

test("an empty expired list does not load owners or document types", async () => {
  const original = [...mock.personDocuments];
  try {
    mock.personDocuments.splice(0, mock.personDocuments.length, ...original.filter((document) => document.verificationStatus !== "EXPIRED"));
    const result = await ExpiredPage({ searchParams: Promise.resolve({}) });
    assert.equal(result.props.page.totalElements, 0);
    assert.deepEqual(result.props.owners, []);
    assert.deepEqual(result.props.documentTypes, []);
    assert.equal(requests.length, 1);
  } finally {
    mock.personDocuments.splice(0, mock.personDocuments.length, ...original);
  }
});

test("person detail loads documents only when its documents tab is opened", async () => {
  const personId = mock.people[0].id;
  const params = Promise.resolve({ personId });
  await PersonPage({ params, searchParams: Promise.resolve({}) });
  assert.deepEqual(documentRequests(), []);
  await PersonPage({ params, searchParams: Promise.resolve({ tab: "documentos" }) });
  assert.deepEqual(documentRequests(), [{ name: "serverApiPage", path: `/api/person-documents?personId=${encodeURIComponent(personId)}&page=0&size=20` }]);
});

test("learner detail uses the same person's documents only in the documents tab", async () => {
  const learner = mock.learners[0];
  const params = Promise.resolve({ learnerId: learner.id });
  await LearnerPage({ params, searchParams: Promise.resolve({}) });
  assert.deepEqual(documentRequests(), []);
  const result = await LearnerPage({ params, searchParams: Promise.resolve({ tab: "documentos", document: "chosen-document" }) });
  assert.deepEqual(documentRequests(), [{ name: "serverApiPage", path: `/api/person-documents?personId=${encodeURIComponent(learner.personId)}&page=0&size=20` }, { name: "serverApiGetOrNull", path: "/api/person-documents/chosen-document" }]);
  assert.equal(result.props.activeTab, "documentos");
  assert.equal(result.props.initialDocumentId, "chosen-document");
  assert.ok(result.props.documents.every((document) => document.personId === learner.personId));
});

test("contract detail loads only its contractual files and only in the documents tab", async () => {
  const contractId = mock.contracts[0].id;
  const params = Promise.resolve({ contractId });
  await ContractPage({ params, searchParams: Promise.resolve({}) });
  assert.deepEqual(documentRequests(), []);
  await ContractPage({ params, searchParams: Promise.resolve({ tab: "documentos" }) });
  assert.deepEqual(documentRequests(), [{ name: "serverApiPage", path: `/api/contract-documents?contractId=${encodeURIComponent(contractId)}&page=0&size=20` }]);
});

test("document links choose the learner when present and open the selected document", () => {
  assert.equal(navigation.documentOwnerHref("person-1", "doc-1"), "/sistema/pessoas/person-1?tab=documentos&document=doc-1");
  assert.equal(navigation.documentOwnerHref("person-1", "doc-1", "learner-1"), "/sistema/aprendizes/learner-1?tab=documentos&document=doc-1");
  const encoded = new URL(navigation.documentOwnerHref("person/1", "doc&1"), "https://local.test");
  assert.equal(encoded.pathname, "/sistema/pessoas/person%2F1");
  assert.equal(encoded.searchParams.get("document"), "doc&1");
});

test("invalid pagination values safely select the first page", () => {
  for (const value of [undefined, "", "0", "-1", "abc", "1.5", "Infinity", "2147483648"]) {
    assert.equal(navigation.expiredDocumentsPage(value), 0);
  }
  assert.equal(navigation.expiredDocumentsPage("3"), 2);
  assert.equal(navigation.expiredDocumentsPage(["2", "4"]), 1);
});
