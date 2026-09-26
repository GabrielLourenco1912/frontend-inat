import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeEach, test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const requireDependency = createRequire(import.meta.url);
const modules = new Map();
const requests = [];
let actor;
const components = new Proxy({}, { get: (_, name) => String(name) });
function load(relativePath) {
  if (modules.has(relativePath)) return modules.get(relativePath);
  const filename = [".ts", ".tsx"].map((ext) => new URL(`../src/${relativePath}${ext}`, import.meta.url)).find(existsSync);
  assert.ok(filename, relativePath);
  const exports = {};
  modules.set(relativePath, exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const localRequire = (id) => {
    if (id === "server-only") return {};
    if (id.startsWith("@/components/")) return components;
    if (id === "@/lib/auth/session") return { requireCapability: async () => actor, requireActor: async () => actor };
    if (id === "next/headers") return { cookies: async () => ({ get: () => ({ value: "test-token" }) }) };
    if (id === "@/lib/api/backend") return { backendFetch: async (url) => {
      const result = load("mocks/backend-adapter").mockApiGet(url);
      return new Response(JSON.stringify({ data: result.data, message: result.message }), { status: result.status });
    } };
    if (id === "next/navigation") return {
      redirect: (url) => { throw Object.assign(new Error("Redirect"), { url }); },
      notFound: () => { throw new Error("Not found"); },
    };
    return id.startsWith("@/") ? load(id.slice(2)) : requireDependency(id);
  };
  vm.runInThisContext(`(function(exports, require) { ${source}\n})`, { filename: filename.pathname })(exports, localRequire);
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
const mock = load("mocks/backend-adapter");
const { pageIndex, pageHref, paginationProps, paginateItems } = load("lib/pagination");
const { serverListPage } = load("lib/api/pagination");
beforeEach(() => { requests.length = 0; actor = { ...mock.mockActor, roles: ["ADMIN"] }; });

async function withRecords(collection, count, run) {
  const original = [...collection];
  assert.ok(original.length);
  collection.splice(0, collection.length, ...Array.from({ length: count }, (_, index) => ({
    ...original[0], id: typeof original[0].id === "number" ? 10000 + index : `pagination-${index}`,
  })));
  try { await run(collection); } finally { collection.splice(0, collection.length, ...original); }
}
function paginatedNode(node) {
  if (!node || typeof node !== "object") return undefined;
  if (node.props?.pagination) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const match = paginatedNode(child);
    if (match) return match;
  }
}

for (const [route, collection, endpoint, prop] of [
  ["pessoas", "people", "people", "people"],
  ["aprendizes", "learners", "learners", "records"],
  ["organizacoes", "organizations", "organizations", "records"],
  ["contratos", "contracts", "contracts", "records"],
  ["turmas", "cohorts", "cohorts", "records"],
  ["aulas", "lessons", "lessons", "records"],
  ["atividades", "activities", "activities", "activities"],
  ["comunicacoes", "notifications", "notifications", "records"],
  ["administracao/usuarios", "users", "users", "users"],
  ["administracao/papeis", "roles", "roles", "records"],
  ["administracao/tipos-de-documento", "documentTypes", "document-types", "documentTypes"],
]) {
  test(`${route}: page 2 fetches and renders only 20 primary records`, async () => {
    await withRecords(mock[collection], 45, async () => {
      const Page = load(`app/sistema/${route}/page`).default;
      const result = await Page({ searchParams: Promise.resolve({ page: "2" }) });
      const node = paginatedNode(result);
      assert.ok(node, "Page must expose pagination to its list");
      assert.equal(node.props[prop].length, 20);
      assert.equal(node.props.pagination.total, 45);
      assert.equal(node.props.pagination.page, 1);
      assert.equal(node.props.pagination.totalPages, 3);
      assert.equal(new URL(node.props.pagination.nextHref, "https://local.test").searchParams.get("page"), "3");
      assert.deepEqual(requests.filter((item) => new URL(item.path, "https://local.test").pathname === `/api/${endpoint}`), [
        { name: "serverApiPage", path: `/api/${endpoint}?page=1&size=20` },
      ]);
      assert.equal(String(node.props[prop][0].id), String(mock[collection][20].id));
    });
  });
}

test("inbox can navigate beyond the original 100-record cutoff", async () => {
  await withRecords(mock.notificationRecipients, 125, async () => {
    const result = await load("app/sistema/avisos/page").default({ searchParams: Promise.resolve({ page: "6" }) });
    assert.equal(result.props.initialNotices.length, 20);
    assert.equal(result.props.initialNotices[0].id, "pagination-100");
    assert.equal(result.props.pagination.totalPages, 7);
    assert.deepEqual(requests, [{ name: "serverApiPage", path: "/api/notification-recipients/me?channel=IN_APP&page=5&size=20" }]);
  });
});

test("last, empty and removed pages expose correct bounds without scanning all pages", async () => {
  await withRecords(mock.people, 45, async () => {
    const page = await serverListPage("/api/people", { page: "99" });
    assert.equal(page.content.length, 5);
    assert.equal(page.page, 2);
    assert.equal(paginationProps(page).nextHref, undefined);
    assert.deepEqual(requests.map((item) => item.path), ["/api/people?page=98&size=20", "/api/people?page=2&size=20"]);
  });
  await withRecords(mock.people, 0, async () => {
    requests.length = 0;
    const empty = await serverListPage("/api/people", { page: "3" });
    assert.equal(empty.content.length, 0);
    assert.equal(empty.page, 0);
    assert.equal(paginationProps(empty).previousHref, undefined);
    assert.equal(paginationProps(empty).nextHref, undefined);
    assert.equal(requests.length, 2);
  });
});

test("page parsing rejects malformed input and links preserve tab/filter context", () => {
  for (const value of [undefined, "", "0", "-3", "1.5", "abc", "Infinity", "2147483648"]) assert.equal(pageIndex(value), 0);
  assert.equal(pageIndex(["3", "4"]), 2);
  const href = new URL(pageHref({ tab: "documentos", personType: "GUARDIAN", tag: ["a&b", "c"], page: "8" }, 1), "https://local.test");
  assert.equal(href.searchParams.get("page"), "2");
  assert.equal(href.searchParams.get("tab"), "documentos");
  assert.equal(href.searchParams.get("personType"), "GUARDIAN");
  assert.deepEqual(href.searchParams.getAll("tag"), ["a&b", "c"]);
});

test("person type is filtered by the server before pagination", async () => {
  await withRecords(mock.people, 65, async (people) => {
    people.forEach((person, index) => { person.personTypes = index < 20 ? ["ADMIN"] : ["GUARDIAN"]; });
    const result = await load("app/sistema/pessoas/page").default({ searchParams: Promise.resolve({ personType: "GUARDIAN", page: "2" }) });
    const node = paginatedNode(result);
    assert.equal(node.props.people.length, 20);
    assert.equal(node.props.people[0].id, "pagination-40");
    assert.equal(node.props.pagination.total, 45);
    assert.equal(new URL(node.props.pagination.nextHref, "https://local.test").searchParams.get("personType"), "GUARDIAN");
  });
});

test("non-admin pages keep using scoped endpoints without escalating access", async () => {
  actor = { ...actor, roles: ["LEARNER"], learnerId: mock.learners[0].id };
  await load("lib/portal/pagination").accessibleLessonsPage(actor, { page: "2" });
  await load("lib/portal/pagination").accessibleContractsPage(actor, { page: "2" });
  assert.deepEqual(requests.map((item) => item.path), ["/api/lessons/me", `/api/contracts/learner/${actor.learnerId}`]);
  assert.ok(requests.every((item) => item.name === "serverApiGet"));
});

test("array fallback pages contain no duplicates and clamp after removals", () => {
  const items = Array.from({ length: 45 }, (_, id) => ({ id }));
  const pages = [0, 1, 2].map((index) => paginateItems(items, index));
  assert.deepEqual(pages.map((page) => page.content.length), [20, 20, 5]);
  assert.deepEqual(pages.flatMap((page) => page.content), items);
  assert.equal(paginateItems(items.slice(0, 20), 2).page, 0);
});

test("deep-linked documents outside the page are loaded individually and checked against the owner", async () => {
  await withRecords(mock.personDocuments, 45, async (documents) => {
    const owner = documents[0].personId;
    const { personDocumentPage } = load("lib/documents/pagination");
    const result = await personDocumentPage(owner, { document: "pagination-44" });
    assert.equal(result.page.content.length, 20);
    assert.equal(result.focusedDocument.id, "pagination-44");
    assert.equal(requests.length, 2);
    assert.ok(requests.every((item) => item.name !== "serverApiAll"));
    const foreign = await personDocumentPage("another-owner", { document: "pagination-44" });
    assert.equal(foreign.focusedDocument, undefined);
  });
});

for (const [resource, collection, field] of [
  ["people", "people", "fullName"], ["learners", "learners", "registrationNumber"],
  ["organizations", "organizations", "legalName"], ["contracts", "contracts", null],
  ["cohorts", "cohorts", "name"], ["lessons", "lessons", "title"],
  ["activities", "activities", "title"], ["notifications", "notifications", "title"],
  ["users", "users", "displayName"], ["roles", "roles", "name"],
  ["document-types", "documentTypes", "name"],
]) {
  test(`${resource}: search finds later records before paginating and retains the query`, async () => {
    await withRecords(mock[collection], 65, async (records) => {
      const previousLearner = { ...mock.learners[0] };
      try {
        const queryTerm = resource === "learners" || resource === "contracts" ? "9000" : "Resultado remoto";
        if (!field) mock.learners[0].registrationNumber = 900000;
        records.forEach((record, index) => {
          if (resource === "learners") record.registrationNumber = index < 40 ? 1000 + index : 900000 + index;
          else if (field) record[field] = index < 40 ? "Outro registro" : "Resultado remoto";
          else record.learnerId = index < 40 ? "unknown" : mock.learners[0].id;
        });
        const query = { q: queryTerm, page: "2" };
        const page = await serverListPage(`/api/${resource}`, query);
        assert.equal(page.totalElements, 25);
        assert.equal(page.content.length, 5);
        assert.equal(page.page, 1);
        assert.equal(page.totalPages, 2);
        assert.equal(requests.length, 1);
        const url = new URL(requests[0].path, "https://local.test");
        assert.equal(url.pathname, `/api/search/${resource}`);
        assert.equal(url.searchParams.get("q"), query.q);
        assert.equal(url.searchParams.get("size"), "20");
        const links = paginationProps(page, query);
        assert.equal(links.search, query.q);
        assert.equal(new URL(links.previousHref, "https://local.test").searchParams.get("q"), query.q);
      } finally { Object.assign(mock.learners[0], previousLearner); }
    });
  });
}

test("lookups filter eligibility and text before returning groups of five", async () => {
  await withRecords(mock.people, 52, async (people) => {
    people.forEach((person, index) => Object.assign(person, {
      fullName: index < 30 ? "Outra pessoa" : "Pessoa buscada",
      personTypes: ["GUARDIAN"], birthDate: index < 40 ? "2020-01-01" : "1990-01-01",
    }));
    const pages = [0, 1, 2].map((page) => mock.mockApiGet(`/api/lookups/people?purpose=guardian&q=Pessoa%20buscada&page=${page}&size=5`).data);
    assert.deepEqual(pages.map((page) => page.content.length), [5, 5, 2]);
    assert.ok(pages.every((page) => page.totalElements === 12));
    assert.equal(new Set(pages.flatMap((page) => page.content.map((item) => item.id))).size, 12);
    assert.deepEqual(Object.keys(pages[0].content[0]).sort(), ["id", "label"]);
    assert.equal(mock.mockApiGet("/api/lookups/people?purpose=guardian&size=20").status, 400);
    assert.equal(mock.mockApiGet("/api/lookups/people?purpose=employer").status, 400);
    assert.equal(mock.mockApiGet("/api/lookups/people?purpose=guardian&q=inexistente").data.totalElements, 0);
  });
});

test("non-admin textual search uses the scoped search endpoint", async () => {
  actor = { ...actor, roles: ["INSTRUCTOR"] };
  await load("lib/portal/pagination").accessibleLessonsPage(actor, { q: "aula" });
  assert.deepEqual(requests, [{ name: "serverApiPage", path: "/api/search/lessons?q=aula&page=0&size=20" }]);
});
