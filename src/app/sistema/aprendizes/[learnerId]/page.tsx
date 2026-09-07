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
  PersonDocument,
} from "@/lib/api/domain-contracts";
import { serverApiAll, serverApiGet, serverApiGetOrNull } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";
import {
  accessibleActivities,
  accessibleContracts,
  accessibleLessons,
  accessibleOrganizations,
} from "@/lib/portal/data";

export default async function LearnerDetailPage({
  params,
}: {
  params: Promise<{ learnerId: string }>;
}) {
  const [actor, { learnerId }] = await Promise.all([
    requireCapability("learners:read"),
    params,
  ]);
  const learner = await serverApiGetOrNull<Learner>(
    `/api/learners/${encodeURIComponent(learnerId)}`,
  );
  if (!learner) notFound();

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
      instructor
        ? Promise.resolve([] as Contract[])
        : accessibleContracts(actor).then((items) =>
            items.filter((contract) => contract.learnerId === learner.id),
          ),
      accessibleOrganizations(actor),
      admin
        ? serverApiGet<LearnerGuardian[]>(
            `/api/learners/${encodeURIComponent(learner.id)}/guardians`,
          )
        : Promise.resolve([]),
      admin
        ? serverApiAll<CohortEnrollment>("/api/cohort-enrollments").then(
            (items) => items.filter((item) => item.learnerId === learner.id),
          )
        : Promise.resolve([]),
      admin ? serverApiAll<Cohort>("/api/cohorts") : Promise.resolve([]),
    ]);

  let lessons: Lesson[] = [];
  let attendance: AttendanceRecord[] = [];
  let activities: Activity[] = [];
  let submissions: ActivitySubmission[] = [];

  if (admin) {
    const [allLessons, participants, allAttendance, allActivities, allSubmissions] =
      await Promise.all([
        accessibleLessons(actor),
        serverApiAll<LessonParticipant>("/api/lesson-participants"),
        serverApiAll<AttendanceRecord>("/api/attendance-records"),
        serverApiAll<Activity>("/api/activities"),
        serverApiAll<ActivitySubmission>("/api/activity-submissions"),
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
  } else if (learnerSelf) {
    lessons = await accessibleLessons(actor);
    [activities, submissions] = await Promise.all([
      accessibleActivities(actor, lessons),
      serverApiGet<ActivitySubmission[]>(
        `/api/activity-submissions/learner/${encodeURIComponent(learner.id)}`,
      ),
    ]);
  } else if (instructor) {
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

  const [documents, documentTypes] = admin
    ? await Promise.all([
        serverApiAll<PersonDocument>("/api/person-documents").then((items) =>
          items.filter((document) => document.personId === learner.personId),
        ),
        serverApiAll<DocumentType>("/api/document-types"),
      ])
    : [[], []];

  return (
    <LearnerDossier
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
      documents={documents}
      documentTypes={documentTypes}
      canSeeDocuments={can(actor, "documents:read")}
      canSeeSensitiveContract={!instructor}
      canSeeGuardians={admin}
      canManage={can(actor, "learners:manage")}
    />
  );
}
