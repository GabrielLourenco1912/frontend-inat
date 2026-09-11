import { APPRENTICESHIP_WEEKLY_HOURS } from "@/lib/apprenticeship/policy";

export function ApprenticeshipWorkloadField() {
  return <label>
    <span className="portal-label">Modelo de aprendizagem</span>
    <select name="weeklyWorkloadHours" defaultValue="20" className="portal-field mt-2 h-10 w-full px-3" required>
      {APPRENTICESHIP_WEEKLY_HOURS.map((hours) => <option key={hours} value={hours}>{hours}h semanais</option>)}
    </select>
    <span className="mt-1.5 block text-xs text-[var(--inat-muted)]">Aulas online são exclusivas do modelo de 30h.</span>
  </label>;
}
