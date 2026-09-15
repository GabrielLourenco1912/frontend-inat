import { canExportAttendance } from "@/lib/attendance/export-permissions";
import { personDocumentPage } from "@/lib/documents/pagination";
import { paginationProps, type ListQuery } from "@/lib/pagination";
import { notFound } from "next/navigation";
import { LearnerDossier } from "@/components/portal/LearnerDossier";
import { can, hasRole } from "@/domain/auth";
import type {
  Activity,
  ActivitySubmission,
  AttendanceRecord,
  Cohort,
  CohortEnrollment,
  Contract,
  DocumentType,
  Learner,
  LearnerGuardian,
  Lesson,
  LessonParticipant,
  Person,
} from "@/lib/api/domain-contracts";
import { serverApiAll, serverApiGet, serverApiGetOrNull } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";
import { firstQueryValue } from "@/lib/documents/navigation";
import {
  accessibleActivities,
  accessibleContracts,
  accessibleLessons,
  accessibleOrganizations,
} from "@/lib/portal/data";

export default async function LearnerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ learnerId: string }>;
  searchParams: Promise<ListQuery>;
}) {
  const [actor, { learnerId }, query] = await Promise.all([
    requireCapability("learners:read"),
    params,
    searchParams,
  ]);
  const learner = await serverApiGetOrNull<Learner>(
    `/api/learners/${encodeURIComponent(learnerId)}`,
  );
  if (!learner) notFound();

  const activeTab = firstQueryValue(query.tab) ?? "dados";
  const admin = hasRole(actor, "ADMIN");
  const learnerSelf = hasRole(actor, "LEARNER") && actor.learnerId === learner.id;
  const instructor = hasRole(actor, "INSTRUCTOR");

  const [person, contracts, organizations, guardians, enrollments, cohorts] =
    await Promise.all([
      admin
        ? serverApiGetOrNull<Person>(
            `/api/people/${encodeURIComponent(learner.personId)}`,
          )
        : Promise.resolve(null),
      instructor || activeTab !== "contrato"
        ? Promise.resolve([] as Contract[])
        : accessibleContracts(actor).then((items) =>
            items.filter((contract) => contract.learnerId === learner.id),
          ),
      activeTab === "contrato" ? accessibleOrganizations(actor) : Promise.resolve([]),
      admin && activeTab === "responsaveis"
        ? serverApiGet<LearnerGuardian[]>(
            `/api/learners/${encodeURIComponent(learner.id)}/guardians`,
          )
        : Promise.resolve([]),
      admin && activeTab === "turmas"
        ? serverApiAll<CohortEnrollment>("/api/cohort-enrollments").then(
            (items) => items.filter((item) => item.learnerId === learner.id),
          )
        : Promise.resolve([]),
      admin && activeTab === "turmas" ? serverApiAll<Cohort>("/api/cohorts") : Promise.resolve([]),
    ]);

  let lessons: Lesson[] = [];
  let attendance: AttendanceRecord[] = [];
  let activities: Activity[] = [];
  let submissions: ActivitySubmission[] = [];

  const academicTab = activeTab === "frequencia" || activeTab === "atividades";
  if (admin && academicTab) {
    const [allLessons, participants, allAttendance, allActivities, allSubmissions] =
      await Promise.all([
        accessibleLessons(actor),
        serverApiAll<LessonParticipant>("/api/lesson-participants"),
        activeTab === "frequencia" ? serverApiAll<AttendanceRecord>("/api/attendance-records") : Promise.resolve([]),
        activeTab === "atividades" ? serverApiAll<Activity>("/api/activities") : Promise.resolve([]),
        activeTab === "atividades" ? serverApiGet<ActivitySubmission[]>(`/api/activity-submissions/learner/${encodeURIComponent(learner.id)}`) : Promise.resolve([]),
      ]);
    const lessonIds = new Set(
      participants
        .filter((participant) => participant.learnerId === learner.id)
        .map((participant) => participant.lessonId),
    );
    lessons = allLessons.filter((lesson) => lessonIds.has(lesson.id));
    attendance = allAttendance.filter((record) => record.learnerId === learner.id);
    activities = allActivities.filter((activity) => lessonIds.has(activity.lessonId));
    submissions = allSubmissions.filter((submission) => submission.learnerId === learner.id);
  } else if (learnerSelf && academicTab) {
    lessons = await accessibleLessons(actor);
    [activities, submissions] = await Promise.all([
      accessibleActivities(actor, lessons),
      serverApiGet<ActivitySubmission[]>(
        `/api/activity-submissions/learner/${encodeURIComponent(learner.id)}`,
      ),
    ]);
  } else if (instructor && academicTab) {
    const instructorLessons = await accessibleLessons(actor);
    const rosters = await Promise.all(
      instructorLessons.map((lesson) =>
        serverApiGet<LessonParticipant[]>(
          `/api/lesson-participants/lesson/${encodeURIComponent(lesson.id)}`,
        ),
      ),
    );
    const lessonIds = new Set(
      rosters
        .flat()
        .filter((participant) => participant.learnerId === learner.id)
        .map((participant) => participant.lessonId),
    );
    lessons = instructorLessons.filter((lesson) => lessonIds.has(lesson.id));
    activities = await accessibleActivities(actor, lessons);
    const [activitySubmissions, attendanceByLesson] = await Promise.all([
      Promise.all(
        activities.map((activity) =>
          serverApiGet<ActivitySubmission[]>(
            `/api/activity-submissions/activity/${encodeURIComponent(activity.id)}`,
          ),
        ),
      ),
      Promise.all(
        lessons.map((lesson) =>
          serverApiGet<AttendanceRecord[]>(
            `/api/attendance-records/lesson/${encodeURIComponent(lesson.id)}`,
          ),
        ),
      ),
    ]);
    submissions = activitySubmissions
      .flat()
      .filter((submission) => submission.learnerId === learner.id);
    attendance = attendanceByLesson
      .flat()
      .filter((record) => record.learnerId === learner.id);
  }

  const [documentResult, documentTypes] = admin && activeTab === "documentos"
    ? await Promise.all([
        personDocumentPage(learner.personId, query),
        serverApiAll<DocumentType>("/api/document-types"),
      ])
    : [null, []];

  return (
    <LearnerDossier
      activeTab={activeTab}
      initialDocumentId={firstQueryValue(query.document)}
      learner={learner}
      person={person}
      displayName={person?.fullName ?? (learnerSelf ? actor.name : learner.registrationNumber)}
      contracts={contracts}
      organizations={organizations}
      guardians={guardians}
      enrollments={enrollments}
      cohorts={cohorts}
      lessons={lessons}
      attendance={attendance}
      activities={activities}
      submissions={submissions}
      documents={documentResult?.page.content ?? []}
      focusedDocument={documentResult?.focusedDocument}
      documentPagination={documentResult ? paginationProps(documentResult.page, { ...query, document: undefined, tab: "documentos" }) : undefined}
      documentTypes={documentTypes}
      canSeeDocuments={can(actor, "documents:read")}
      canSeeSensitiveContract={!instructor}
      canSeeGuardians={admin}
      canManage={can(actor, "learners:manage")}
      canExportAttendance={canExportAttendance(actor, "learners")}
    />
  );
}
