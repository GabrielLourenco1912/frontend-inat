import "server-only";

import { hasRole, type Actor } from "@/domain/auth";
import type { AttendanceRecord, Contract, Learner, Lesson, Organization, Person } from "@/lib/api/domain-contracts";
import { serverApiGet, serverApiPage } from "@/lib/api/server";
import { canExportAttendance, type AttendanceExportScope } from "@/lib/attendance/export-permissions";

export type AttendanceExportRow = {
  record: AttendanceRecord;
  lesson: Lesson;
  learner: Learner;
  learnerName: string;
};
export type AttendanceExport = {
  title: string;
  scope: AttendanceExportScope;
  learnerCount: number;
  restricted: boolean;
  rows: AttendanceExportRow[];
};

// Bound concurrent requests while resolving the complete export, independently of UI pages.
async function mapBatches<T, R>(items: T[], run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let offset = 0; offset < items.length; offset += 8) {
    results.push(...await Promise.all(items.slice(offset, offset + 8).map(run)));
  }
  return results;
}

export async function attendanceExportData(actor: Actor, scope: AttendanceExportScope, id: string): Promise<AttendanceExport> {
  if (!canExportAttendance(actor, scope)) throw new Error("Attendance export is not authorized");
  const admin = hasRole(actor, "ADMIN");
  let title: string;
  let learners: Learner[];
  if (scope === "organizations") {
    const organization = await serverApiGet<Organization>(`/api/organizations/${encodeURIComponent(id)}`);
    title = organization.tradeName || organization.legalName;
    const contracts = await serverApiGet<Contract[]>(`/api/contracts/organization/${encodeURIComponent(id)}`);
    const ids = [...new Set(contracts.map((contract) => contract.learnerId))];
    learners = await mapBatches(ids, (learnerId) => serverApiGet<Learner>(`/api/learners/${encodeURIComponent(learnerId)}`));
  } else {
    const learner = await serverApiGet<Learner>(`/api/learners/${encodeURIComponent(id)}`);
    learners = [learner];
    title = learner.registrationNumber;
  }
  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]));
  const people = admin ? await mapBatches([...new Set(learners.map((learner) => learner.personId))], (personId) => serverApiGet<Person>(`/api/people/${encodeURIComponent(personId)}`)) : [];
  const personNames = new Map(people.map((person) => [person.id, person.fullName]));
  if (scope === "learners") title = personNames.get(learners[0].personId) || title;

  let records: AttendanceRecord[] = [];
  let lessons: Lesson[] = [];
  if (learners.length && admin) {
    // Read every page, retaining only records belonging to the selected learners.
    for (let page = 0; ; page++) {
      const result = await serverApiPage<AttendanceRecord>(`/api/attendance-records?page=${page}&size=100`);
      records.push(...result.content.filter((record) => learnerMap.has(record.learnerId)));
      if (page + 1 >= result.totalPages) break;
    }
    lessons = await mapBatches([...new Set(records.map((record) => record.lessonId))], (lessonId) => serverApiGet<Lesson>(`/api/lessons/${encodeURIComponent(lessonId)}`));
  } else if (learners.length) {
    // The lesson endpoint includes participation as well as teaching. Only request rosters
    // of lessons this instructor manages, as required by the attendance API.
    lessons = (await serverApiGet<Lesson[]>("/api/lessons/me"))
      .filter((lesson) => lesson.instructorPersonId === actor.personId);
    const byLesson = await mapBatches(lessons, (lesson) => serverApiGet<AttendanceRecord[]>(`/api/attendance-records/lesson/${encodeURIComponent(lesson.id)}`));
    records = byLesson.flat().filter((record) => learnerMap.has(record.learnerId));
  }
  const lessonMap = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const rows = [...new Map(records.map((record) => [record.id, record])).values()].map((record) => {
    const learner = learnerMap.get(record.learnerId)!;
    const lesson = lessonMap.get(record.lessonId);
    if (!lesson) throw new Error("Attendance lesson could not be resolved");
    return { record, lesson, learner, learnerName: personNames.get(learner.personId) ?? "" };
  }).sort((a, b) => a.learner.registrationNumber.localeCompare(b.learner.registrationNumber)
    || a.lesson.startsAt.localeCompare(b.lesson.startsAt) || a.record.id.localeCompare(b.record.id));
  return { title, scope, learnerCount: learners.length, restricted: !admin, rows };
}
