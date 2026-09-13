import { relatedRecords } from "@/lib/api/related";
import { paginationProps, type ListPageProps } from "@/lib/pagination";
import { accessibleActivitiesPage } from "@/lib/portal/pagination";
import { ActivitiesView } from "@/components/portal/ActivitiesView";
import { can } from "@/domain/auth";
import { hasRole } from "@/domain/auth";
import type { ActivitySubmission, Lesson } from "@/lib/api/domain-contracts";
import { serverApiAll, serverApiGet } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";
import { accessibleLessons } from "@/lib/portal/data";

export default async function ActivitiesPage({ searchParams }: ListPageProps) {
  const query = await searchParams ?? {};
  const actor = await requireCapability("activities:read");
  const canManage = can(actor, "activities:manage");
  const scopedLessons = hasRole(actor, "ADMIN") ? [] : await accessibleLessons(actor);
  const page = await accessibleActivitiesPage(actor, query, scopedLessons);
  const activities = page.content;
  const lessons = await relatedRecords<Lesson>("lessons", activities.map((activity) => activity.lessonId));
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
    <ActivitiesView key={page.page} pagination={paginationProps(page, query)}
      activities={activities}
      lessons={lessons}
      submissions={submissions}
      learner={hasRole(actor, "LEARNER")}
      canManage={canManage}
    />
  );
}
