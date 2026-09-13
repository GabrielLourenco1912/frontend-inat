import { notFound } from "next/navigation";
import { LessonWorkspace } from "@/components/portal/LessonWorkspace";
import { can, hasRole } from "@/domain/auth";
import { requireCapability } from "@/lib/auth/session";
import type {
  Activity,
  AttendanceRecord,
  Lesson,
  LessonParticipant,
} from "@/lib/api/domain-contracts";
import { serverApiGet, serverApiGetOrNull } from "@/lib/api/server";

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
  const [activities, participants, attendance] = await Promise.all([
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
  ]);

  return (
    <LessonWorkspace
      lesson={lesson}
      activities={activities}
      participants={participants}
      attendance={attendance}
      canManage={canManage}
      allowManualLearnerId={canManage && !hasRole(actor, "ADMIN")}
    />
  );
}
