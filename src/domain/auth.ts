export const ROLES = [
  "LEARNER",
  "INSTRUCTOR",
  "EMPLOYER_MANAGER",
  "ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

export type Capability =
  | "dashboard:read"
  | "agenda:read"
  | "lessons:read"
  | "lessons:manage"
  | "attendance:manage"
  | "activities:read"
  | "activities:manage"
  | "learners:read"
  | "learners:manage"
  | "people:read"
  | "organizations:read"
  | "organizations:manage"
  | "contracts:read"
  | "contracts:manage"
  | "cohorts:read"
  | "cohorts:manage"
  | "documents:read"
  | "documents:manage"
  | "communications:manage"
  | "administration:read"
  | "administration:manage";

export type Actor = {
  id: string;
  userId: string;
  personId?: string;
  learnerId?: string;
  name: string;
  shortName: string;
  email: string;
  initials: string;
  roles: Role[];
  organizationIds: string[];
  roleLabel: string;
  isActive: boolean;
  status: "Ativo" | "Convidado" | "Bloqueado" | "Desativado";
  lastAccess: string;
};

const roleCapabilities: Record<Role, Capability[]> = {
  LEARNER: [
    "dashboard:read",
    "agenda:read",
    "lessons:read",
    "activities:read",
    "learners:read",
    "contracts:read",
  ],
  INSTRUCTOR: [
    "dashboard:read",
    "agenda:read",
    "lessons:read",
    "attendance:manage",
    "activities:read",
    "activities:manage",
    "learners:read",
  ],
  EMPLOYER_MANAGER: [
    "dashboard:read",
    "learners:read",
    "organizations:read",
    "contracts:read",
  ],
  ADMIN: [
    "dashboard:read",
    "agenda:read",
    "lessons:read",
    "lessons:manage",
    "attendance:manage",
    "activities:read",
    "activities:manage",
    "learners:read",
    "learners:manage",
    "people:read",
    "organizations:read",
    "organizations:manage",
    "contracts:read",
    "contracts:manage",
    "cohorts:read",
    "cohorts:manage",
    "documents:read",
    "documents:manage",
    "communications:manage",
    "administration:read",
    "administration:manage",
  ],
};

export function can(actor: Actor, capability: Capability) {
  return actor.isActive
    && actor.roles.some((role) => roleCapabilities[role]?.includes(capability));
}

export function hasRole(actor: Actor, role: Role) {
  return actor.isActive && actor.roles.includes(role);
}
