import { notFound } from "next/navigation";
import { ActivityWorkspace } from "@/components/portal/ActivityWorkspace";
import { can, hasRole } from "@/domain/auth";
import { requireCapability } from "@/lib/auth/session";
import type {
  Activity,
  ActivityFile,
  ActivitySubmission,
  Lesson,
  SubmissionFile,
} from "@/lib/api/domain-contracts";
import { serverApiGet, serverApiGetOrNull } from "@/lib/api/server";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const [actor, { activityId }] = await Promise.all([
    requireCapability("activities:read"),
    params,
  ]);
  const activity = await serverApiGetOrNull<Activity>(
    `/api/activities/${encodeURIComponent(activityId)}`,
  );
  if (!activity) notFound();

  const canManage = can(actor, "activities:manage");
  const [lesson, activityFiles] = await Promise.all([
    serverApiGet<Lesson>(`/api/lessons/${encodeURIComponent(activity.lessonId)}`),
    serverApiGet<ActivityFile[]>(
      `/api/activities/${encodeURIComponent(activity.id)}/files`,
    ),
  ]);

  let submissions: ActivitySubmission[] = [];
  if (hasRole(actor, "LEARNER") && actor.learnerId) {
    submissions = (
      await serverApiGet<ActivitySubmission[]>(
        `/api/activity-submissions/learner/${encodeURIComponent(actor.learnerId)}`,
      )
    ).filter((submission) => submission.activityId === activity.id);
  } else if (canManage) {
    submissions = await serverApiGet<ActivitySubmission[]>(
      `/api/activity-submissions/activity/${encodeURIComponent(activity.id)}`,
    );
  }

  const fileEntries = await Promise.all(
    submissions.map(async (submission) => [
      submission.id,
      await serverApiGet<SubmissionFile[]>(
        `/api/activity-submissions/${encodeURIComponent(submission.id)}/files`,
      ),
    ] as const),
  );

  return (
    <ActivityWorkspace
      activity={activity}
      lesson={lesson}
      activityFiles={activityFiles}
      submissions={submissions}
      submissionFiles={Object.fromEntries(fileEntries)}
      learnerId={actor.learnerId}
      learner={hasRole(actor, "LEARNER")}
      canManage={canManage}
    />
  );
}
