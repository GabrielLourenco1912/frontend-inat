import { notFound } from "next/navigation";
import { LessonWorkspace } from "@/components/portal/LessonWorkspace";
import { can, hasRole } from "@/domain/auth";
import { requireCapability } from "@/lib/auth/session";
import type {
  Activity,
  AttendanceRecord,
  Contract,
  Learner,
  Lesson,
  LessonParticipant,
  Person,
} from "@/lib/api/domain-contracts";
import { serverApiAll, serverApiGet, serverApiGetOrNull } from "@/lib/api/server";
import { apprenticeshipLessonDate, hasOnlineEligibleContract } from "@/lib/apprenticeship/policy";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const [actor, { lessonId }] = await Promise.all([
    requireCapability("lessons:read"),
    params,
  ]);
  const lesson = await serverApiGetOrNull<Lesson>(
    `/api/lessons/${encodeURIComponent(lessonId)}`,
  );
  if (!lesson) notFound();

  const canManage = can(actor, "attendance:manage");
  const admin = hasRole(actor, "ADMIN");
  const online = lesson.deliveryMode === "ONLINE";
  const [activities, participants, attendance, learners, people, contracts] = await Promise.all([
    serverApiGet<Activity[]>(`/api/activities/lesson/${encodeURIComponent(lesson.id)}`),
    canManage
      ? serverApiGet<LessonParticipant[]>(
          `/api/lesson-participants/lesson/${encodeURIComponent(lesson.id)}`,
        )
      : Promise.resolve([]),
    canManage
      ? serverApiGet<AttendanceRecord[]>(
          `/api/attendance-records/lesson/${encodeURIComponent(lesson.id)}`,
        )
      : Promise.resolve([]),
    hasRole(actor, "ADMIN") ? serverApiAll<Learner>("/api/learners") : Promise.resolve([]),
    hasRole(actor, "ADMIN") ? serverApiAll<Person>("/api/people") : Promise.resolve([]),
    admin && online ? serverApiAll<Contract>("/api/contracts") : Promise.resolve([]),
  ]);
  const personMap = new Map(people.map((person) => [person.id, person.fullName]));
  const activePeople = new Set(people.filter((person) => person.status === "ACTIVE").map((person) => person.id));
  const lessonDate = apprenticeshipLessonDate(lesson.startsAt);
  const learnerOptions = learners.filter((learner) =>
    learner.status === "ACTIVE" && activePeople.has(learner.personId)
    && !participants.some((participant) => participant.learnerId === learner.id)
    && (!online || hasOnlineEligibleContract(learner.id, contracts, lessonDate)),
  ).map((learner) => ({
    id: learner.id,
    label: `${learner.registrationNumber} · ${personMap.get(learner.personId) ?? learner.personId}`,
  }));

  return (
    <LessonWorkspace
      lesson={lesson}
      activities={activities}
      participants={participants}
      attendance={attendance}
      learnerOptions={learnerOptions}
      allowManualLearnerId={!admin}
      canManage={canManage}
    />
  );
}
