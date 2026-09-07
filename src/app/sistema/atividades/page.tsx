import { ActivitiesView } from "@/components/portal/ActivitiesView";
import { can } from "@/domain/auth";
import { hasRole } from "@/domain/auth";
import type { ActivitySubmission } from "@/lib/api/domain-contracts";
import { serverApiAll, serverApiGet } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";
import { accessibleActivities, accessibleLessons } from "@/lib/portal/data";

export default async function ActivitiesPage() {
  const actor = await requireCapability("activities:read");
  const canManage = can(actor, "activities:manage");
  const lessons = await accessibleLessons(actor);
  const activities = await accessibleActivities(actor, lessons);
  let submissions: ActivitySubmission[] = [];
  if (hasRole(actor, "LEARNER") && actor.learnerId) {
    submissions = await serverApiGet<ActivitySubmission[]>(
      `/api/activity-submissions/learner/${encodeURIComponent(actor.learnerId)}`,
    );
  } else if (hasRole(actor, "ADMIN")) {
    submissions = await serverApiAll<ActivitySubmission>("/api/activity-submissions");
  } else if (canManage) {
    submissions = (
      await Promise.all(
        activities.map((activity) =>
          serverApiGet<ActivitySubmission[]>(
            `/api/activity-submissions/activity/${encodeURIComponent(activity.id)}`,
          ),
        ),
      )
    ).flat();
  }

  return (
    <ActivitiesView
      activities={activities}
      lessons={lessons}
      submissions={submissions}
      learner={hasRole(actor, "LEARNER")}
      canManage={canManage}
    />
  );
}
