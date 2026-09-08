import { ROLES, type Actor, type Role } from "@/domain/auth";
import type {
  CurrentUserContextResponse,
  UserAccountStatus,
  UserResponse,
} from "@/lib/api/contracts";

const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  INSTRUCTOR: "Instrutor",
  LEARNER: "Aprendiz",
  EMPLOYER_MANAGER: "Gestor de empresa",
};

const statusLabels: Record<UserAccountStatus, Actor["status"]> = {
  ACTIVE: "Ativo",
  INVITED: "Convidado",
  LOCKED: "Bloqueado",
  DISABLED: "Desativado",
};

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatAccess(value: string | null) {
  if (!value) return "Primeiro acesso";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function mapUserToActor(
  user: UserResponse,
  context?: Pick<CurrentUserContextResponse, "learnerId" | "organizationIds">,
): Actor {
  const roles: Role[] = [];
  for (const role of user.roles) {
    if (isRole(role)) roles.push(role);
  }
  const name = user.displayName.trim() || user.loginEmail;
  const primaryRole = (["ADMIN", "INSTRUCTOR", "LEARNER", "EMPLOYER_MANAGER"] as const).find(
    (role) => roles.includes(role),
  );

  return {
    id: user.id,
    userId: user.id,
    personId: user.personId || undefined,
    learnerId: context?.learnerId || undefined,
    name,
    shortName: name.split(/\s+/)[0] || name,
    email: user.loginEmail,
    initials: initials(name) || "IN",
    roles,
    organizationIds: context?.organizationIds ?? [],
    roleLabel: primaryRole ? roleLabels[primaryRole] : "Sem perfil de acesso",
    isActive: user.status === "ACTIVE",
    status: statusLabels[user.status] ?? "Desativado",
    lastAccess: formatAccess(user.lastLoginAt),
  };
}
