import "server-only";
import type { Actor } from "@/domain/auth";
import { hasRole } from "@/domain/auth";
import { serverListPage } from "@/lib/api/pagination";
import { pageIndex, paginateItems, queryValue, type ListQuery } from "@/lib/pagination";
import { accessibleActivities, accessibleContracts, accessibleLearners, accessibleLessons, accessibleOrganizations } from "@/lib/portal/data";
import type { Activity, Contract, Learner, Lesson, Organization } from "@/lib/api/domain-contracts";

async function accessiblePage<T>(actor: Actor, path: string, query: ListQuery, fallback: () => Promise<T[]>) {
  if (hasRole(actor, "ADMIN") || queryValue(query.q)?.trim()) return serverListPage<T>(path, query);
  // Scoped endpoints do not accept page/size. Keep their authorization boundary.
  return paginateItems(await fallback(), pageIndex(query.page));
}
export const accessibleLearnersPage = (actor: Actor, query: ListQuery) =>
  accessiblePage<Learner>(actor, "/api/learners", query, () => accessibleLearners(actor));
export const accessibleOrganizationsPage = (actor: Actor, query: ListQuery) =>
  accessiblePage<Organization>(actor, "/api/organizations", query, () => accessibleOrganizations(actor));
export const accessibleContractsPage = (actor: Actor, query: ListQuery) =>
  accessiblePage<Contract>(actor, "/api/contracts", query, () => accessibleContracts(actor));
export const accessibleLessonsPage = (actor: Actor, query: ListQuery) =>
  accessiblePage<Lesson>(actor, "/api/lessons", query, () => accessibleLessons(actor));
export const accessibleActivitiesPage = (actor: Actor, query: ListQuery, lessons: Lesson[]) =>
  accessiblePage<Activity>(actor, "/api/activities", query, () => accessibleActivities(actor, lessons));
