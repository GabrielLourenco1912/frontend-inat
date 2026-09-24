import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const timeZoneExports = {};
const timeZoneSource = ts.transpileModule(readFileSync(new URL("../src/lib/api/time-zone.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInThisContext(`(function(exports) { ${timeZoneSource}\n})`)(timeZoneExports);

const exports = {};
const source = ts.transpileModule(readFileSync(new URL("../src/lib/attendance/drafts.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInThisContext(`(function(exports, require) { ${source}\n})`)(exports, (specifier) => {
  if (specifier === "@/lib/api/time-zone") return timeZoneExports;
  throw new Error(`Unexpected import: ${specifier}`);
});
const { reconcileAttendance, acknowledgeAttendance, attendanceChanged, attendanceBody, saveAttendanceBatch } = exports;
const participant = (id) => ({ id, learnerId: `learner-${id}`, lessonId: "lesson", status: "EXPECTED", participationType: "REGULAR" });
const record = (id, overrides = {}) => ({ id: `record-${id}`, lessonParticipantId: id, lessonId: "lesson", learnerId: `learner-${id}`,
  status: "ABSENT", checkInAt: null, checkOutAt: null, notes: null, updatedAt: "2026-09-01T00:00:00Z", ...overrides });
const drafts = (count) => reconcileAttendance([], Array.from({ length: count }, (_, i) => participant(String(i))), []).map((row) => ({ ...row, status: "ABSENT" }));
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };

test("refresh adds participants and preserves edits and failure messages", () => {
  const original = reconcileAttendance([], [participant("1")], [record("1")]);
  const edited = [{ ...original[0], notes: "Preenchimento pendente", saveState: "error", error: "Falha de conexão" }];
  const merged = reconcileAttendance(edited, [participant("1"), participant("2")], [record("1", { status: "EXCUSED", updatedAt: "2026-09-02T00:00:00Z" })]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].notes, "Preenchimento pendente");
  assert.equal(merged[0].status, "ABSENT");
  assert.equal(merged[0].error, "Falha de conexão");
  assert.equal(merged[0].baseline.status, "EXCUSED");
  assert.equal(attendanceChanged(merged[0]), true);
  assert.equal(attendanceChanged(merged[1]), false);
});

test("unedited records follow newer backend data and cancelled participants remain identifiable", () => {
  const original = reconcileAttendance([], [participant("1"), participant("removed")], [record("1")]);
  const merged = reconcileAttendance(original, [{ ...participant("1"), status: "CANCELLED" }], [record("1", { status: "EXCUSED" })]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].participant.status, "CANCELLED");
  assert.equal(merged[0].status, "EXCUSED");
  assert.equal(attendanceChanged(merged[0]), false);
});

test("successful POST stores its ID and baseline even if an older refresh arrives", () => {
  const draft = drafts(1)[0];
  const acknowledged = acknowledgeAttendance(draft, record("0", { updatedAt: "2026-09-03T00:00:00Z" }));
  assert.equal(acknowledged.recordId, "record-0");
  assert.equal(attendanceChanged(acknowledged), false);
  for (const incoming of [[], [record("0", { status: "EXCUSED" })]]) {
    const merged = reconcileAttendance([acknowledged], [participant("0")], incoming)[0];
    assert.equal(merged.recordId, "record-0");
    assert.equal(merged.status, "ABSENT");
    assert.equal(attendanceChanged(merged), false);
  }
  const newer = reconcileAttendance([acknowledged], [participant("0")], [record("0", { status: "EXCUSED", updatedAt: "2026-09-04T00:00:00Z" })])[0];
  assert.equal(newer.status, "EXCUSED");
});

test("a lost POST response can be reconciled without creating the attendance again", () => {
  const failed = { ...drafts(1)[0], saveState: "error", error: "Conexão perdida" };
  const recovered = reconcileAttendance([failed], [participant("0")], [record("0")])[0];
  assert.equal(recovered.recordId, "record-0");
  assert.equal(recovered.saveState, "saved");
  assert.equal(attendanceChanged(recovered), false);
  const changed = { ...failed, notes: "Observação corrigida" };
  const recoveredChanged = reconcileAttendance([changed], [participant("0")], [record("0")])[0];
  assert.equal(recoveredChanged.recordId, "record-0");
  assert.equal(attendanceChanged(recoveredChanged), true);
});

test("batch saves never exceed five requests and report each success immediately", async () => {
  const gates = Array.from({ length: 12 }, deferred);
  const calls = [];
  const outcomes = [];
  let active = 0, maximum = 0;
  const saving = saveAttendanceBatch(drafts(12), async (row) => {
    const id = Number(row.participant.id);
    calls.push(id); maximum = Math.max(maximum, ++active);
    await gates[id].promise;
    active--;
    if (id === 2 || id === 8) throw new Error(`Falha ${id}`);
    return record(String(id));
  }, (row, result) => outcomes.push({ id: Number(row.participant.id), status: result.status }));
  assert.equal(calls.length, 5);
  gates[0].resolve();
  await new Promise(setImmediate);
  assert.deepEqual(outcomes, [{ id: 0, status: "fulfilled" }]);
  gates.slice(1, 5).forEach((gate) => gate.resolve());
  await new Promise(setImmediate);
  assert.equal(calls.length, 10);
  gates.slice(5, 10).forEach((gate) => gate.resolve());
  await new Promise(setImmediate);
  assert.equal(calls.length, 12);
  gates.slice(10).forEach((gate) => gate.resolve());
  assert.deepEqual(await saving, { saved: 10, failed: 2 });
  assert.equal(maximum, 5);
  assert.equal(outcomes.length, 12);
  assert.deepEqual(outcomes.filter((result) => result.status === "rejected").map((result) => result.id), [2, 8]);
});

test("invalid rows fail individually while valid ones are saved, and only failures need retry", async () => {
  let rows = drafts(3);
  rows[1] = { ...rows[1], status: "PRESENT", checkInAt: "" };
  rows[2] = { ...rows[2], status: "PRESENT", checkInAt: "2026-09-16T10:00", checkOutAt: "2026-09-16T09:00" };
  const sent = [];
  const result = await saveAttendanceBatch(rows, async (row) => { sent.push(row.participant.id); return record(row.participant.id); }, (row, outcome) => {
    rows = rows.map((current) => current.participant.id !== row.participant.id ? current : outcome.status === "fulfilled"
      ? acknowledgeAttendance(current, outcome.value) : { ...current, saveState: "error", error: outcome.reason.message });
  });
  assert.deepEqual(result, { saved: 1, failed: 2 });
  assert.deepEqual(sent, ["0"]);
  assert.match(rows[1].error, /entrada/);
  assert.match(rows[2].error, /saída/);
  assert.deepEqual(rows.filter(attendanceChanged).map((row) => row.participant.id), ["1", "2"]);
  const body = attendanceBody({ ...rows[0], notes: "  anotação  " });
  assert.equal(body.notes, "anotação");
  assert.equal(body.checkInAt, null);
});
