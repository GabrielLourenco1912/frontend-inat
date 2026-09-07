import { UserAccountManager } from "@/components/portal/UserAccountManager";
import type { UserResponse } from "@/lib/api/contracts";
import type { Person, RoleRecord, UserRole } from "@/lib/api/domain-contracts";
import { serverApiAll, serverApiGet } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";

export default async function UsersPage() {
  await requireCapability("administration:read");
  const [users, people, roles] = await Promise.all([
    serverApiAll<UserResponse>("/api/users"),
    serverApiAll<Person>("/api/people"),
    serverApiAll<RoleRecord>("/api/roles"),
  ]);
  const assignments = await Promise.all(
    users.map((user) =>
      serverApiGet<UserRole[]>(`/api/users/${encodeURIComponent(user.id)}/roles`),
    ),
  );
  const roleAssignments = Object.fromEntries(
    users.map((user, index) => [user.id, assignments[index]]),
  );
  return <UserAccountManager users={users} people={people} roles={roles} roleAssignments={roleAssignments} />;
}
