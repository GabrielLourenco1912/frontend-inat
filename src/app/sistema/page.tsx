import { DashboardView } from "@/components/portal/DashboardView";
import { can } from "@/domain/auth";
import type { PageResponse } from "@/lib/api/contracts";
import type { NotificationRecipient } from "@/lib/api/domain-contracts";
import { serverApiGet } from "@/lib/api/server";
import { requireActor } from "@/lib/auth/session";
import {
  accessibleActivities,
  accessibleContracts,
  accessibleLearners,
  accessibleLessons,
  accessibleOrganizations,
} from "@/lib/portal/data";

export default async function SystemHomePage() {
  const actor = await requireActor();
  const lessons = can(actor, "lessons:read") ? await accessibleLessons(actor) : [];
  const [activities, inbox, learners, contracts, organizations] = await Promise.all([
    can(actor, "activities:read") ? accessibleActivities(actor, lessons) : Promise.resolve([]),
    serverApiGet<PageResponse<NotificationRecipient>>(
      "/api/notification-recipients/me?channel=IN_APP&page=0&size=20",
    ),
    can(actor, "learners:read") ? accessibleLearners(actor) : Promise.resolve([]),
    can(actor, "contracts:read") ? accessibleContracts(actor) : Promise.resolve([]),
    can(actor, "organizations:read") ? accessibleOrganizations(actor) : Promise.resolve([]),
  ]);
  return <DashboardView actor={actor} data={{ lessons, activities, notices: inbox.content, learnerCount: learners.length, contractCount: contracts.length, organizationCount: organizations.length }} />;
}
