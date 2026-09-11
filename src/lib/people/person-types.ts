import type { Person, PersonTypeCode } from "@/lib/api/domain-contracts";
import type { UserResponse } from "@/lib/api/contracts";

export const PERSON_TYPE_OPTIONS: { code: PersonTypeCode; label: string }[] = [
  { code: "ADMIN", label: "Administrador" },
  { code: "INSTRUCTOR", label: "Instrutor" },
  { code: "LEARNER", label: "Aprendiz" },
  { code: "EMPLOYER_MANAGER", label: "Gestor de empresa" },
  { code: "GUARDIAN", label: "Responsável" },
];

export function hasPersonType(person: Person | undefined, type: string): boolean {
  return person?.personTypes?.some((code) => code === type) ?? false;
}

export function personTypeLabels(person: Person): string {
  return PERSON_TYPE_OPTIONS.filter(({ code }) => hasPersonType(person, code))
    .map(({ label }) => label).join(", ") || "Sem tipo definido";
}

export function isEligibleGuardian(person: Person, today: string): boolean {
  const [year, month, day] = person.birthDate.split("-").map(Number);
  const birthdayDay = Math.min(day, new Date(Date.UTC(year + 18, month, 0)).getUTCDate());
  const birthday = `${year + 18}-${String(month).padStart(2, "0")}-${String(birthdayDay).padStart(2, "0")}`;
  return hasPersonType(person, "GUARDIAN") && birthday <= today;
}

export function isEligibleInstructor(person: Person, users: UserResponse[]): boolean {
  return person.status === "ACTIVE" && hasPersonType(person, "INSTRUCTOR")
    && users.some((user) => user.personId === person.id && user.status === "ACTIVE"
      && user.roles.includes("INSTRUCTOR"));
}
