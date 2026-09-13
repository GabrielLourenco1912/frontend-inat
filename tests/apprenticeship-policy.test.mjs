import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// Execute the real policy, contract payload builder and lesson server page.
// Only framework hooks, data requests and unrelated child components are stubbed.
const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const requireDependency = createRequire(import.meta.url);
const modules = new Map();
const requests = [];
const componentStubs = new Proxy({}, { get: (_, name) => String(name) });
let actor;
let data;

function load(relativePath) {
  const base = path.join(sourceRoot, relativePath);
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
    if (id.startsWith("@/components/") && !id.endsWith("/ApprenticeshipWorkloadField")) return componentStubs;
    if (id === "next/navigation") return {
      useRouter: () => ({ refresh() {} }),
      notFound: () => { throw new Error("Not found"); },
    };
    if (id === "@/lib/auth/session") return { requireCapability: async () => actor };
    if (id === "@/lib/api/server") return Object.fromEntries(
      ["serverApiAll", "serverApiGet", "serverApiGetOrNull"].map((name) => [name, async (url) => {
        requests.push(url);
        assert.ok(Object.hasOwn(data, url), `Unexpected data request: ${url}`);
        return data[url];
      }]),
    );
    return id.startsWith("@/") ? load(id.slice(2)) : requireDependency(id);
  };
  vm.runInThisContext(`(function(exports, require) { ${source}\n})`, { filename })(exports, localRequire);
  return exports;
}

const policy = load("lib/apprenticeship/policy");
const { ApprenticeshipWorkloadField } = load("components/portal/ApprenticeshipWorkloadField");
const { ContractCreator } = load("components/portal/ResourceCreators");
const LessonPage = load("app/sistema/aulas/[lessonId]/page").default;
const contract = (learnerId, minutes = 1800, overrides = {}) => ({
  id: `contract-${learnerId}`, learnerId, weeklyWorkloadMinutes: minutes,
  status: "ACTIVE", startDate: "2026-01-01", endDate: "2026-12-31", ...overrides,
});

beforeEach(() => {
  requests.length = 0;
  actor = { roles: ["ADMIN"], isActive: true };
  const ids = ["twenty", "thirty", "listed", "suspended", "inactive-person", "expired", "forty"];
  data = {
    "/api/lessons/lesson": { id: "lesson", startsAt: "2026-09-10T13:00:00Z", deliveryMode: "ONLINE" },
    "/api/activities/lesson/lesson": [],
    "/api/lesson-participants/lesson/lesson": [{ learnerId: "listed", status: "EXPECTED" }],
    "/api/attendance-records/lesson/lesson": [],
    "/api/learners": ids.map((id) => ({ id, personId: `person-${id}`, registrationNumber: id, status: id === "suspended" ? "SUSPENDED" : "ACTIVE" })),
    "/api/people": ids.map((id) => ({ id: `person-${id}`, fullName: id, status: id === "inactive-person" ? "INACTIVE" : "ACTIVE" })),
    "/api/contracts": ids.map((id) => contract(id, id === "twenty" ? 1200 : id === "forty" ? 2400 : 1800,
      id === "expired" ? { endDate: "2026-09-09" } : {})),
  };
});

test("only the 20h and 30h options are rendered, defaulting to 20h", () => {
  const html = renderToStaticMarkup(ApprenticeshipWorkloadField());
  assert.equal((html.match(/<option /g) ?? []).length, 2);
  assert.match(html, /value="20" selected=""/);
  assert.match(html, /value="30"/);
  assert.match(html, /name="weeklyWorkloadHours"/);
  assert.doesNotMatch(html, /type="number"/);
});

test("the demo contracts illustrate both supported models", () => {
  const { contracts } = load("mocks/backend-adapter");
  assert.deepEqual([...new Set(contracts.map((contract) => contract.weeklyWorkloadMinutes))].sort(), [1200, 1800]);
  assert.ok(contracts.some((contract) => contract.status === "ACTIVE" && contract.weeklyWorkloadMinutes === 1800));
});

for (const [hours, minutes] of [["20", 1200], ["30", 1800]]) {
  test(`the contract form sends ${minutes} minutes for ${hours} hours`, () => {
    const modal = ContractCreator({ learners: [], people: [], organizations: [] });
    const formComponent = modal.props.children(() => {});
    const form = new FormData();
    form.set("weeklyWorkloadHours", hours);
    form.set("monthlySalary", "1234,56");
    const payload = formComponent.props.build(form);
    assert.equal(payload.weeklyWorkloadMinutes, minutes);
    assert.equal(payload.monthlySalary, 1234.56);
    assert.equal(payload.status, "DRAFT");
    assert.ok(!Object.hasOwn(payload, "weeklyWorkloadHours"));
    assert.match(renderToStaticMarkup(formComponent.props.children), /name="weeklyWorkloadHours"/);
  });
}

test("unexpected values cannot bypass the two front-end options", () => {
  for (const value of ["", "0", "25", "40", "1200", "1800", "20.5", "30h", " 30 "]) {
    assert.throws(() => policy.apprenticeshipWorkloadMinutes(value), /20h ou 30h/);
  }
});

test("online eligibility requires exactly 30 hours, not a minimum of 30", () => {
  assert.equal(policy.isOnlineEligibleContract(contract("learner", 1800), "2026-09-10"), true);
  for (const minutes of [0, 1200, 1500, 1799, 1801, 2400]) {
    assert.equal(policy.isOnlineEligibleContract(contract("learner", minutes), "2026-09-10"), false);
  }
});

test("an online contract must be active and cover the lesson date inclusively", () => {
  for (const status of ["DRAFT", "SUSPENDED", "ENDED", "CANCELLED"]) {
    assert.equal(policy.isOnlineEligibleContract(contract("learner", 1800, { status }), "2026-09-10"), false);
  }
  const singleDay = contract("learner", 1800, { startDate: "2026-09-10", endDate: "2026-09-10" });
  assert.equal(policy.isOnlineEligibleContract(singleDay, "2026-09-10"), true);
  assert.equal(policy.isOnlineEligibleContract(singleDay, "2026-09-09"), false);
  assert.equal(policy.isOnlineEligibleContract(singleDay, "2026-09-11"), false);
  assert.equal(policy.isOnlineEligibleContract(contract("learner", 1800, { endDate: null }), "2027-01-01"), true);
});

test("the lesson date matches the backend São Paulo time zone", () => {
  assert.equal(policy.apprenticeshipLessonDate("2026-09-11T01:00:00Z"), "2026-09-10");
  assert.equal(policy.apprenticeshipLessonDate("2026-09-11T03:00:00Z"), "2026-09-11");
});

test("a learner cannot use someone else's 30-hour contract", () => {
  assert.equal(policy.hasOnlineEligibleContract("twenty", [contract("thirty")], "2026-09-10"), false);
});

function participantOptions() {
  const mock = load("mocks/backend-adapter");
  const substitutions = { learners: data["/api/learners"], people: data["/api/people"], contracts: data["/api/contracts"], lessons: [data["/api/lessons/lesson"]], lessonParticipants: data["/api/lesson-participants/lesson/lesson"].map((item) => ({ ...item, lessonId: "lesson" })) };
  const originals = Object.fromEntries(Object.keys(substitutions).map((key) => [key, [...mock[key]]]));
  try {
    for (const [key, items] of Object.entries(substitutions)) mock[key].splice(0, mock[key].length, ...items);
    const response = mock.mockApiGet("/api/lookups/learners?purpose=participant&contextId=lesson&size=5");
    assert.equal(response.status, 200);
    return response.data;
  } finally {
    for (const [key, items] of Object.entries(originals)) mock[key].splice(0, mock[key].length, ...items);
  }
}

test("online lookup includes only eligible, unlisted learners", () => {
  assert.deepEqual(participantOptions().content.map((option) => option.id), ["thirty"]);
});
test("onsite lookup keeps both workloads", () => {
  data["/api/lessons/lesson"].deliveryMode = "ONSITE";
  const ids = participantOptions().content.map((option) => option.id);
  assert.ok(ids.includes("twenty"));
  assert.ok(ids.includes("thirty"));
});
test("empty online lookup cannot offer learners without eligible contracts", () => {
  data["/api/contracts"] = [];
  assert.equal(participantOptions().totalElements, 0);
});
test("lesson pages do not preload learner, person or contract catalogs", async () => {
  for (const role of ["ADMIN", "INSTRUCTOR"]) {
    actor.roles = [role];
    const page = await LessonPage({ params: Promise.resolve({ lessonId: "lesson" }) });
    assert.equal(page.props.canManage, true);
    assert.equal(page.props.allowManualLearnerId, role === "INSTRUCTOR");
    assert.ok(!requests.includes("/api/contracts"));
    assert.ok(!requests.includes("/api/people"));
    assert.ok(!requests.includes("/api/learners"));
  }
});
