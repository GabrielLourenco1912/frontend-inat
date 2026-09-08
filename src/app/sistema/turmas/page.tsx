import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { CohortCreator } from "@/components/portal/ResourceCreators";
import { apiLabel, formatPeriod } from "@/lib/api/format";
import { serverApiAll } from "@/lib/api/server";
import type { Cohort } from "@/lib/api/domain-contracts";
import { requireCapability } from "@/lib/auth/session";

const weekdays = ["—", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default async function CohortsPage() {
  await requireCapability("cohorts:read");
  const cohorts = await serverApiAll<Cohort>("/api/cohorts");
  const records = cohorts.map((cohort) => ({
    id: cohort.id,
    href: `/sistema/turmas/${cohort.id}`,
    name: cohort.name,
    code: cohort.code,
    schedule: `${weekdays[cohort.defaultWeekday] ?? cohort.defaultWeekday} · ${cohort.shiftCode}`,
    period: formatPeriod(cohort.startDate, cohort.endDate),
    state: apiLabel(cohort.status),
  }));
  return (
    <>
      <PageHeader eyebrow="Acadêmico" title="Turmas e matrículas" description="Período, agenda padrão e matrículas ativas de cada percurso formativo." action={<CohortCreator />} />
      <DataList records={records} itemLabel="turma" searchPlaceholder="Buscar código ou nome da turma" emptyDescription="Nenhuma turma foi cadastrada no backend." columns={[
        { key: "name", label: "Turma", primary: true },
        { key: "code", label: "Código", mono: true },
        { key: "schedule", label: "Agenda padrão" },
        { key: "period", label: "Período", hideBelow: "lg" },
        { key: "state", label: "Situação" },
      ]} />
    </>
  );
}
