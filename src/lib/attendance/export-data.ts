import "server-only";

import { hasRole, type Actor } from "@/domain/auth";
import type {
  AttendanceRecord,
  Cohort,
  Learner,
  Lesson,
  Organization,
  Person,
} from "@/lib/api/domain-contracts";
import { serverApiAll, serverApiGet } from "@/lib/api/server";
import {
  canExportAttendance,
  type AttendanceExportScope,
} from "@/lib/attendance/export-permissions";

export type AttendanceExportPeriod = {
  startDate?: string;
  endDate?: string;
};

export type AttendanceExportRow = {
  record: AttendanceRecord;
  lesson: Lesson;
  cohort: Cohort;
  learner: Learner;
  learnerPerson?: Person;
  instructorName: string;
};

export type AttendanceExport = {
  title: string;
  scope: AttendanceExportScope;
  learnerCount: number;
  lessonCount: number;
  restricted: boolean;
  activeContractsOnly: boolean;
  period: AttendanceExportPeriod;
  rows: AttendanceExportRow[];
};

async function mapBatches<T, R>(items: T[], run: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let offset = 0; offset < items.length; offset += 8) {
    results.push(...await Promise.all(items.slice(offset, offset + 8).map(run)));
  }
  return results;
}

function attendancePath(
  scope: AttendanceExportScope,
  id: string,
  period: AttendanceExportPeriod,
) {
  const query = new URLSearchParams();
  if (scope === "organizations") {
    query.set("organizationId", id);
    query.set("activeContractsOnly", "true");
  } else {
    query.set("learnerId", id);
    query.set("activeContractsOnly", "false");
  }
  if (period.startDate) query.set("startDate", period.startDate);
  if (period.endDate) query.set("endDate", period.endDate);
  return `/api/attendance-records?${query}`;
}

export async function attendanceExportData(
  actor: Actor,
  scope: AttendanceExportScope,
  id: string,
  period: AttendanceExportPeriod = {},
): Promise<AttendanceExport> {
  if (!canExportAttendance(actor, scope)) {
    throw new Error("Attendance export is not authorized");
  }
  const admin = hasRole(actor, "ADMIN");
  const activeContractsOnly = scope === "organizations";

  let title: string;
  let selectedLearner: Learner | undefined;
  if (scope === "organizations") {
    const organization = await serverApiGet<Organization>(
      `/api/organizations/${encodeURIComponent(id)}`,
    );
    title = organization.tradeName || organization.legalName;
  } else {
    selectedLearner = await serverApiGet<Learner>(
      `/api/learners/${encodeURIComponent(id)}`,
    );
    title = String(selectedLearner.registrationNumber);
  }

  const records = await serverApiAll<AttendanceRecord>(
    attendancePath(scope, id, period),
  );
  const learnerIds = [...new Set(records.map((record) => record.learnerId))];
  const learners = await mapBatches(
    learnerIds.filter((learnerId) => learnerId !== selectedLearner?.id),
    (learnerId) => serverApiGet<Learner>(
      `/api/learners/${encodeURIComponent(learnerId)}`,
    ),
  );
  if (selectedLearner) learners.push(selectedLearner);
  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]));

  const lessons = await mapBatches(
    [...new Set(records.map((record) => record.lessonId))],
    (lessonId) => serverApiGet<Lesson>(
      `/api/lessons/${encodeURIComponent(lessonId)}`,
    ),
  );
  const lessonMap = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const cohorts = await mapBatches(
    [...new Set(lessons.map((lesson) => lesson.cohortId))],
    (cohortId) => serverApiGet<Cohort>(
      `/api/cohorts/${encodeURIComponent(cohortId)}`,
    ),
  );
  const cohortMap = new Map(cohorts.map((cohort) => [cohort.id, cohort]));

  const people = admin
    ? await mapBatches(
        [...new Set([
          ...learners.map((learner) => learner.personId),
          ...lessons.map((lesson) => lesson.instructorPersonId),
        ])],
        (personId) => serverApiGet<Person>(
          `/api/people/${encodeURIComponent(personId)}`,
        ),
      )
    : [];
  const personMap = new Map(people.map((person) => [person.id, person]));
  if (selectedLearner) {
    title = personMap.get(selectedLearner.personId)?.fullName || title;
  }

  const rows = [...new Map(records.map((record) => [record.id, record])).values()]
    .map((record) => {
      const learner = learnerMap.get(record.learnerId);
      const lesson = lessonMap.get(record.lessonId);
      const cohort = lesson ? cohortMap.get(lesson.cohortId) : undefined;
      if (!learner || !lesson || !cohort) {
        throw new Error("Attendance relationships could not be resolved");
      }
      return {
        record,
        lesson,
        cohort,
        learner,
        learnerPerson: personMap.get(learner.personId),
        instructorName:
          personMap.get(lesson.instructorPersonId)?.fullName
          ?? (admin ? "Instrutor não identificado" : "Nome restrito ao perfil"),
      };
    })
    .sort((a, b) => a.learner.registrationNumber - b.learner.registrationNumber
      || a.lesson.startsAt.localeCompare(b.lesson.startsAt)
      || a.record.id.localeCompare(b.record.id));

  return {
    title,
    scope,
    learnerCount: new Set(rows.map((row) => row.learner.id)).size,
    lessonCount: new Set(rows.map((row) => row.lesson.id)).size,
    restricted: !admin,
    activeContractsOnly,
    period,
    rows,
  };
}
