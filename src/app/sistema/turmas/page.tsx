import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { CohortCreator } from "@/components/portal/ResourceCreators";
import { apiLabel, formatPeriod } from "@/lib/api/format";
import { serverListPage } from "@/lib/api/pagination";
import { paginationProps, type ListPageProps } from "@/lib/pagination";
import { queryValue } from "@/lib/pagination";
import { cohortStatusOptions } from "@/lib/status-filters";
import type { Cohort } from "@/lib/api/domain-contracts";
import { requireCapability } from "@/lib/auth/session";

const weekdays = ["—", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default async function CohortsPage({ searchParams }: ListPageProps) {
  await requireCapability("cohorts:read");
  const query = await searchParams ?? {};
  const page = await serverListPage<Cohort>("/api/cohorts", query);
  const cohorts = page.content;
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
      <DataList key={page.page} pagination={paginationProps(page, query)} statusOptions={cohortStatusOptions} selectedStatus={queryValue(query.status) ?? ""} records={records} itemLabel="turma" searchPlaceholder="Buscar código ou nome da turma" emptyDescription="Nenhuma turma foi cadastrada no backend." columns={[
        { key: "name", label: "Turma", primary: true },
        { key: "code", label: "Código", mono: true },
        { key: "schedule", label: "Agenda padrão" },
        { key: "period", label: "Período", hideBelow: "lg" },
        { key: "state", label: "Situação" },
      ]} />
    </>
  );
}
