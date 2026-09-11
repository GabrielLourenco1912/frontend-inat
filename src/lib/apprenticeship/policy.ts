import type { Contract } from "@/lib/api/domain-contracts";

// INAT-specific presentation and eligibility; the API still stores minutes.
export const APPRENTICESHIP_WEEKLY_HOURS = [20, 30] as const;
export const ONLINE_WEEKLY_WORKLOAD_MINUTES = 30 * 60;

export function apprenticeshipWorkloadMinutes(hours: string) {
  if (hours !== "20" && hours !== "30") {
    throw new Error("Selecione um modelo de aprendizagem de 20h ou 30h semanais.");
  }
  return Number(hours) * 60;
}

export function apprenticeshipLessonDate(startsAt: string) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date(startsAt));
}

export function isOnlineEligibleContract(contract: Contract, lessonDate: string) {
  return contract.weeklyWorkloadMinutes === ONLINE_WEEKLY_WORKLOAD_MINUTES
    && contract.status === "ACTIVE"
    && contract.startDate <= lessonDate
    && (!contract.endDate || contract.endDate >= lessonDate);
}

export function hasOnlineEligibleContract(learnerId: string, contracts: Contract[], lessonDate: string) {
  return contracts.some((contract) => contract.learnerId === learnerId && isOnlineEligibleContract(contract, lessonDate));
}
