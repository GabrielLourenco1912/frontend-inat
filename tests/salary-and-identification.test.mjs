import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loader } from "./support/source-loader.mjs";

test("o salário recebe pontos durante a digitação, centavos por vírgula e sai como número", () => {
  let value;
  const load = loader({ react: { useState: (initial) => [value ??= initial(), (next) => { value = next; }] } });
  const { MaskedInput } = load("@/components/design-system/MaskedInput");
  const { parseSalary } = load("@/lib/inputs/masks");
  const input = () => MaskedInput({ name: "monthlySalary", mask: "salary" });
  const validity = [];
  const target = { setCustomValidity: (message) => validity.push(message) };
  for (const [typed, expected] of [["1", "1"], ["12", "12"], ["123", "123"], ["1234", "1.234"], ["1.234,", "1.234,"], ["1.234,56", "1.234,56"]]) {
    input().props.onChange({ target: { ...target, value: typed } });
    assert.equal(value, expected);
  }
  assert.equal(parseSalary(value), 1234.56);
  input().props.onChange({ target: { ...target, value: "1234" } });
  input().props.onBlur({ target });
  assert.equal(value, "1.234,00");
  assert.equal(parseSalary(value), 1234);
  input().props.onChange({ target: { ...target, value: "0" } });
  assert.ok(validity.at(-1).includes("maior que zero"));
  input().props.onChange({ target: { ...target, value: "" } });
  assert.equal(value, "");
});

test("colar salário em formato brasileiro ou decimal preserva o valor monetário", () => {
  let value;
  const load = loader({ react: { useState: (initial) => [value ??= initial(), (next) => { value = next; }] } });
  const { MaskedInput } = load("@/components/design-system/MaskedInput");
  for (const text of ["1.069,48", "1069.48", "R$ 1.069,48"]) {
    let prevented = false;
    MaskedInput({ mask: "salary", defaultValue: 1200 }).props.onPaste({
      clipboardData: { getData: () => text },
      currentTarget: { setCustomValidity() {} },
      preventDefault: () => { prevented = true; },
    });
    assert.equal(prevented, true);
    assert.equal(value, "1.069,48");
  }
});

function workspaceLoader() {
  const primitive = ({ children }) => React.createElement("div", null, children);
  return loader({
    react: { ...React, useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}], useRef: (value) => ({ current: value }), useMemo: (callback) => callback(), useTransition: () => [false, () => {}] },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@/components/design-system/PortalPrimitives": { DefinitionList: primitive, EmptyState: primitive, PageHeader: primitive, SectionHeading: primitive, Sheet: primitive, StatusMark: primitive },
    "@/components/design-system/ClientPagination": { PaginatedContent: primitive },
    "@/components/design-system/Icon": { Icon: () => null },
    "@/components/design-system/DetailLinksList": { DetailLinksList: () => null },
    "@/components/design-system/DetailList": { DetailList: ({ items, renderItem }) => React.createElement("div", null, items.map(renderItem)) },
    "@/components/portal/ExternalLessonPlayer": { ExternalLessonPlayer: () => null },
    "@/components/portal/ActivityCreator": { ActivityCreator: () => null },
  });
}

const lesson = { id: "lesson-id", title: "Cidadania", description: "Conteúdo da aula", cohortId: "cohort-id", cohortCode: "SEGUNDA", cohortName: "Turma de segunda", instructorName: "Maria Instrutora", instructorPersonId: "instructor-id", startsAt: "2026-09-10T13:00:00Z", endsAt: "2026-09-10T15:00:00Z", deliveryMode: "ONSITE", status: "IN_PROGRESS", room: "Sala 1" };

test("a chamada exibe o nome e a matrícula do aprendiz e busca sem acentos", () => {
  const load = workspaceLoader();
  const { LessonWorkspace } = load("@/components/portal/LessonWorkspace");
  const participant = { id: "participant-id", learnerId: "01LEARNEROPAQUEID0000000000", learnerName: "João Aprendiz", learnerRegistrationNumber: 423, participationType: "REGULAR", status: "EXPECTED" };
  const markup = renderToStaticMarkup(React.createElement(LessonWorkspace, { lesson, lessonFiles: [], activities: [], participants: [participant], attendance: [], canManage: true }));
  assert.ok(markup.includes("João Aprendiz"));
  assert.ok(markup.includes("Matrícula 423"));
  assert.ok(markup.includes("Buscar nome ou matrícula"));
  assert.ok(!markup.replace(/<[^>]+>/g, "").includes(participant.learnerId));
  const { filterDetailItems } = load("@/lib/detail-filter");
  assert.equal(filterDetailItems([participant], "joao", (item) => `${item.learnerName} ${item.learnerRegistrationNumber}`).length, 1);
});

test("a correção de entregas identifica o aprendiz por nome e matrícula", () => {
  const load = workspaceLoader();
  const { ActivityWorkspace } = load("@/components/portal/ActivityWorkspace");
  const submission = { id: "submission-id", learnerId: "01LEARNEROPAQUEID0000000000", learnerName: "João Aprendiz", learnerRegistrationNumber: 423, status: "SUBMITTED", submittedAt: lesson.endsAt, textAnswer: "Resposta" };
  const markup = renderToStaticMarkup(React.createElement(ActivityWorkspace, { activity: { id: "activity-id", title: "Cidadania", description: "Enunciado", maxScore: 10, dueAt: lesson.endsAt, status: "PUBLISHED" }, lesson, activityFiles: [], submissions: [submission], submissionFiles: {}, learner: false, canManage: true }));
  assert.ok(markup.includes("João Aprendiz"));
  assert.ok(markup.includes("Matrícula 423"));
  assert.ok(!markup.replace(/<[^>]+>/g, "").includes(submission.learnerId));
});
