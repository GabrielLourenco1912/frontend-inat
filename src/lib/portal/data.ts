import "server-only";

import type { Actor } from "@/domain/auth";
import { hasRole } from "@/domain/auth";
import { serverApiAll, serverApiGet, serverApiGetOrNull } from "@/lib/api/server";
import type {
  Activity,
  Contract,
  Learner,
  Lesson,
  Organization,
} from "@/lib/api/domain-contracts";

function uniqueById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

export async function accessibleLessons(actor: Actor) {
  return hasRole(actor, "ADMIN")
    ? serverApiAll<Lesson>("/api/lessons")
    : serverApiGet<Lesson[]>("/api/lessons/me");
}

export async function accessibleOrganizations(actor: Actor) {
  if (hasRole(actor, "ADMIN")) {
    return serverApiAll<Organization>("/api/organizations");
  }
  if (!hasRole(actor, "EMPLOYER_MANAGER")) return [];

  const organizations = await Promise.all(
    actor.organizationIds.map((id) =>
      serverApiGetOrNull<Organization>(`/api/organizations/${encodeURIComponent(id)}`),
    ),
  );
  return organizations.filter((value): value is Organization => value !== null);
}

export async function accessibleContracts(actor: Actor) {
  if (hasRole(actor, "ADMIN")) {
    return serverApiAll<Contract>("/api/contracts");
  }
  if (hasRole(actor, "LEARNER") && actor.learnerId) {
    return serverApiGet<Contract[]>(
      `/api/contracts/learner/${encodeURIComponent(actor.learnerId)}`,
    );
  }
  if (hasRole(actor, "EMPLOYER_MANAGER")) {
    const contracts = await Promise.all(
      actor.organizationIds.map((id) =>
        serverApiGet<Contract[]>(
          `/api/contracts/organization/${encodeURIComponent(id)}`,
        ),
      ),
    );
    return uniqueById(contracts.flat());
  }
  return [];
}

export async function accessibleLearners(actor: Actor) {
  if (hasRole(actor, "ADMIN")) {
    return serverApiAll<Learner>("/api/learners");
  }
  if (hasRole(actor, "LEARNER") && actor.learnerId) {
    const learner = await serverApiGetOrNull<Learner>(
      `/api/learners/${encodeURIComponent(actor.learnerId)}`,
    );
    return learner ? [learner] : [];
  }
  if (hasRole(actor, "EMPLOYER_MANAGER")) {
    const contracts = await accessibleContracts(actor);
    const learnerIds = [...new Set(contracts.map((contract) => contract.learnerId))];
    const learners = await Promise.all(
      learnerIds.map((id) =>
        serverApiGetOrNull<Learner>(`/api/learners/${encodeURIComponent(id)}`),
      ),
    );
    return learners.filter((value): value is Learner => value !== null);
  }
  return [];
}

export async function accessibleActivities(
  actor: Actor,
  knownLessons?: Lesson[],
) {
  if (hasRole(actor, "ADMIN")) {
    return serverApiAll<Activity>("/api/activities");
  }

  const lessons = knownLessons ?? (await accessibleLessons(actor));
  const activities = await Promise.all(
    lessons.map((lesson) =>
      serverApiGet<Activity[]>(
        `/api/activities/lesson/${encodeURIComponent(lesson.id)}`,
      ),
    ),
  );
  return uniqueById(activities.flat());
}
