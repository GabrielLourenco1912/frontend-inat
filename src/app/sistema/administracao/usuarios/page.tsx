import { serverListPage } from "@/lib/api/pagination";
import { paginationProps, type ListPageProps } from "@/lib/pagination";
import { UserAccountManager } from "@/components/portal/UserAccountManager";
import type { UserResponse } from "@/lib/api/contracts";
import type { Person, RoleRecord, UserRole } from "@/lib/api/domain-contracts";
import { serverApiAll, serverApiGet } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";

export default async function UsersPage({ searchParams }: ListPageProps) {
  const query = await searchParams ?? {};
  await requireCapability("administration:read");
  const [page, people, roles] = await Promise.all([
    serverListPage<UserResponse>("/api/users", query),
    serverApiAll<Person>("/api/people"),
    serverApiAll<RoleRecord>("/api/roles"),
  ]);
  const users = page.content;
  const assignments = await Promise.all(
    users.map((user) =>
      serverApiGet<UserRole[]>(`/api/users/${encodeURIComponent(user.id)}/roles`),
    ),
  );
  const roleAssignments = Object.fromEntries(
    users.map((user, index) => [user.id, assignments[index]]),
  );
  return <UserAccountManager key={page.page} pagination={paginationProps(page, query)} users={users} people={people} roles={roles} roleAssignments={roleAssignments} />;
}
