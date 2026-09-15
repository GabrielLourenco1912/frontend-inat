import { hasRole, type Actor } from "@/domain/auth";

export type AttendanceExportScope = "organizations" | "learners";

export function canExportAttendance(actor: Actor, scope: AttendanceExportScope) {
  return hasRole(actor, "ADMIN") || (scope === "learners" && hasRole(actor, "INSTRUCTOR"));
}
