import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const requireDependency = createRequire(import.meta.url);
function load(file) {
  const filename = new URL(`../src/${file}`, import.meta.url);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const localRequire = (name) => name === "@/lib/people/person-types" ? policy : requireDependency(name);
  vm.runInThisContext(`(function(exports, require) { ${source}\n})`, { filename: filename.pathname })(exports, localRequire);
  return exports;
}
const policy = load("lib/people/person-types.ts");
const { PersonTypeFields } = load("components/portal/PersonTypeFields.tsx");

test("a person can hold several classifications without receiving access roles", () => {
  const person = { personTypes: ["INSTRUCTOR", "GUARDIAN"] };
  assert.equal(policy.hasPersonType(person, "INSTRUCTOR"), true);
  assert.equal(policy.hasPersonType(person, "ADMIN"), false);
  assert.equal(policy.personTypeLabels(person), "Instrutor, Responsável");
  assert.equal(policy.hasPersonType(undefined, "ADMIN"), false);
});

test("guardian selection requires the matching type and adulthood", () => {
  const person = { birthDate: "2008-09-11", personTypes: ["GUARDIAN"] };
  assert.equal(policy.isEligibleGuardian(person, "2026-09-10"), false);
  assert.equal(policy.isEligibleGuardian(person, "2026-09-11"), true);
  assert.equal(policy.isEligibleGuardian({ ...person, personTypes: ["ADMIN"] }, "2026-09-11"), false);
});

test("guardian age calculation handles February 29 consistently", () => {
  const person = { birthDate: "2008-02-29", personTypes: ["GUARDIAN"] };
  assert.equal(policy.isEligibleGuardian(person, "2026-02-27"), false);
  assert.equal(policy.isEligibleGuardian(person, "2026-02-28"), true);
});

test("instructors need an active person, matching type and active account with role", () => {
  const person = { id: "person", status: "ACTIVE", personTypes: ["INSTRUCTOR"] };
  const user = { personId: person.id, status: "ACTIVE", roles: ["INSTRUCTOR"] };
  assert.equal(policy.isEligibleInstructor(person, [user]), true);
  assert.equal(policy.isEligibleInstructor(person, []), false);
  assert.equal(policy.isEligibleInstructor({ ...person, status: "INACTIVE" }, [user]), false);
  assert.equal(policy.isEligibleInstructor({ ...person, personTypes: [] }, [user]), false);
  assert.equal(policy.isEligibleInstructor(person, [{ ...user, status: "LOCKED" }]), false);
  assert.equal(policy.isEligibleInstructor(person, [{ ...user, roles: ["ADMIN"] }]), false);
});

test("person form renders five classifications with multiple selections", () => {
  const html = renderToStaticMarkup(PersonTypeFields({ types: ["ADMIN", "INSTRUCTOR"] }));
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 5);
  assert.equal((html.match(/checked=""/g) ?? []).length, 2);
});

test("learner onboarding submits its mandatory classification even when the checkbox is disabled", () => {
  const html = renderToStaticMarkup(PersonTypeFields({ requiredType: "LEARNER" }));
  assert.match(html, /type="hidden" name="personTypes" value="LEARNER"/);
  assert.match(html, /disabled=""[^>]*checked=""[^>]*value="LEARNER"/);
});
