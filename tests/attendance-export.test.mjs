import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeEach, test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import ExcelJS from "exceljs";

const requireDependency = createRequire(import.meta.url);
const modules = new Map();
const requests = [];
let actor;
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
    if (id === "@/lib/auth/session") return { getCurrentActor: async () => actor };
    if (id === "next/headers") return { cookies: async () => ({ get: () => ({ value: "test-token" }) }) };
    if (id === "@/lib/api/backend") return { backendFetch: async (url) => {
      const result = load("mocks/backend-adapter").mockApiGet(url);
      return new Response(JSON.stringify({ data: result.data, message: result.message }), { status: result.status });
    } };
    if (id === "next/navigation") return { redirect: (url) => { throw new Error(`Redirect: ${url}`); } };
    return id.startsWith("@/") ? load(id.slice(2)) : requireDependency(id);
  };
  vm.runInThisContext(`(function(exports, require) { ${source}\n})`, { filename: filename.pathname })(exports, localRequire);
  if (relativePath === "lib/api/server") {
    for (const [name, implementation] of Object.entries(exports)) {
      if (name.startsWith("serverApi")) exports[name] = (...args) => {
        requests.push(args[0]);
        return implementation(...args);
      };
    }
  }
  return exports;
}
const mock = load("mocks/backend-adapter");
const { attendanceExportData } = load("lib/attendance/export-data");
const { attendanceWorkbook, XLSX_CONTENT_TYPE } = load("lib/attendance/export-workbook");
const { GET } = load("app/api/exports/attendance/[scope]/[id]/route");
beforeEach(() => { requests.length = 0; actor = { ...mock.mockActor, roles: ["ADMIN"] }; });

async function withRecords(records, run) {
  const original = [...mock.attendanceRecords];
  mock.attendanceRecords.splice(0, mock.attendanceRecords.length, ...records);
  try { await run(); } finally { mock.attendanceRecords.splice(0, mock.attendanceRecords.length, ...original); }
}
const request = (scope, id) => GET(new Request("https://local.test"), { params: Promise.resolve({ scope, id }) });

test("individual export includes all pages, excludes other learners and produces a readable XLSX", async () => {
  const original = mock.attendanceRecords[0];
  const records = Array.from({ length: 225 }, (_, i) => ({ ...original, id: `attendance-${i}`, learnerId: i < 150 ? original.learnerId : "another-learner" }));
  await withRecords(records, async () => {
    const response = await request("learners", original.learnerId);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), XLSX_CONTENT_TYPE);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.match(response.headers.get("content-disposition"), /\.xlsx"$/);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()));
    const sheet = workbook.getWorksheet("Presenças");
    assert.equal(sheet.rowCount, 151);
    assert.equal(workbook.getWorksheet("Resumo").getCell("B6").value, 150);
    assert.equal(sheet.views[0].state, "frozen");
    assert.deepEqual(requests.filter((path) => path.startsWith("/api/attendance-records?")), [0, 1, 2].map((page) => `/api/attendance-records?page=${page}&size=100`));
  });
});

test("organization export follows its linked learners without duplicates from multiple contracts", async () => {
  const organization = mock.organizations.find((org) => mock.contracts.some((contract) => contract.employerId === org.id));
  const related = mock.contracts.filter((contract) => contract.employerId === organization.id);
  const ids = new Set(related.map((contract) => contract.learnerId));
  const records = [...ids].map((learnerId, i) => ({ ...mock.attendanceRecords[0], id: `org-${i}`, learnerId }));
  records.push({ ...records[0], id: "foreign", learnerId: "unrelated" });
  const duplicate = { ...related[0], id: "another-contract-same-learner" };
  mock.contracts.push(duplicate);
  try {
    await withRecords(records, async () => {
      const report = await attendanceExportData(actor, "organizations", organization.id);
      assert.equal(report.learnerCount, ids.size);
      assert.equal(report.rows.length, ids.size);
      assert.ok(report.rows.every((row) => ids.has(row.learner.id)));
      assert.equal(new Set(report.rows.map((row) => row.record.id)).size, report.rows.length);
    });
  } finally { mock.contracts.splice(mock.contracts.indexOf(duplicate), 1); }
});

test("instructors export only the learner's records in lessons they teach", async () => {
  const lesson = mock.lessons[0];
  const foreignLesson = mock.lessons[1];
  const oldInstructor = foreignLesson.instructorPersonId;
  foreignLesson.instructorPersonId = "different-instructor";
  actor = { ...actor, roles: ["INSTRUCTOR"], personId: lesson.instructorPersonId };
  const learner = mock.learners[0];
  const base = { ...mock.attendanceRecords[0], learnerId: learner.id };
  try {
    await withRecords([
      { ...base, id: "own", lessonId: lesson.id },
      { ...base, id: "foreign", lessonId: foreignLesson.id },
      { ...base, id: "another-learner", learnerId: "unrelated", lessonId: lesson.id },
    ], async () => {
      const report = await attendanceExportData(actor, "learners", learner.id);
      assert.deepEqual(report.rows.map((row) => row.record.id), ["own"]);
      assert.equal(report.restricted, true);
      assert.equal(report.rows[0].learnerName, "");
      assert.ok(!requests.some((path) => path.startsWith("/api/people/")));
      assert.ok(!requests.includes(`/api/attendance-records/lesson/${foreignLesson.id}`));
      assert.ok(!requests.some((path) => path.startsWith("/api/attendance-records?")));
    });
  } finally { foreignLesson.instructorPersonId = oldInstructor; }
});

test("export route checks authentication and scope before querying data", async () => {
  actor = null;
  assert.equal((await request("learners", "id")).status, 401);
  for (const roles of [["LEARNER"], ["EMPLOYER_MANAGER"]]) {
    actor = { ...mock.mockActor, roles };
    assert.equal((await request("learners", "id")).status, 403);
    assert.equal((await request("organizations", "id")).status, 403);
  }
  actor = { ...mock.mockActor, roles: ["INSTRUCTOR"] };
  assert.equal((await request("organizations", "id")).status, 403);
  assert.equal((await request("invalid", "id")).status, 404);
  assert.equal((await request("learners", "../id")).status, 404);
  assert.deepEqual(requests, []);
});

test("empty exports retain the headers and do not invent attendance", async () => {
  await withRecords([], async () => {
    const report = await attendanceExportData(actor, "learners", mock.learners[0].id);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await attendanceWorkbook(report));
    assert.equal(workbook.getWorksheet("Presenças").rowCount, 1);
    assert.equal(workbook.getWorksheet("Resumo").getCell("B6").value, 0);
  });
});

test("workbook preserves leading zeros, accented text, dates and formula-like notes as text", async () => {
  const report = await attendanceExportData(actor, "learners", mock.attendanceRecords[0].learnerId);
  const row = report.rows[0];
  const special = { ...row, learner: { ...row.learner, registrationNumber: "0000123" }, learnerName: "João & Conceição",
    lesson: { ...row.lesson, startsAt: "2026-09-11T01:00:00Z" }, record: { ...row.record, notes: '=HYPERLINK("https://example.test")' } };
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await attendanceWorkbook({ ...report, rows: [special] }));
  const sheet = workbook.getWorksheet("Presenças");
  assert.equal(sheet.getCell("A2").value, "0000123");
  assert.equal(sheet.getCell("B2").value, "João & Conceição");
  assert.match(sheet.getCell("D2").value, /10\/09\/2026.*22:00/);
  assert.equal(sheet.getCell("K2").value, special.record.notes);
  assert.equal(sheet.getCell("K2").type, ExcelJS.ValueType.String);
});
