import { relatedRecords } from "@/lib/api/related";
import { paginationProps, queryValue, type ListPageProps } from "@/lib/pagination";
import { contractStatusOptions } from "@/lib/status-filters";
import { accessibleContractsPage } from "@/lib/portal/pagination";
import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { ContractCreator } from "@/components/portal/ResourceCreators";
import { can } from "@/domain/auth";
import { hasRole } from "@/domain/auth";
import { apiLabel, formatMinutes, formatPeriod } from "@/lib/api/format";
import type { Person, Learner } from "@/lib/api/domain-contracts";
import { requireCapability } from "@/lib/auth/session";
import {
  accessibleOrganizations,
} from "@/lib/portal/data";

export default async function ContractsPage({ searchParams }: ListPageProps) {
  const query = await searchParams ?? {};
  const actor = await requireCapability("contracts:read");
  const page = await accessibleContractsPage(actor, query);
  const contracts = page.content;
  const [learners, organizations] = await Promise.all([
    relatedRecords<Learner>("learners", contracts.map((contract) => contract.learnerId)),
    accessibleOrganizations(actor),
  ]);
  const people = hasRole(actor, "ADMIN") ? await relatedRecords<Person>("people", learners.map((learner) => learner.personId)) : [];
  const learnerMap = new Map(learners.map((learner) => [learner.id, learner]));
  const personMap = new Map(people.map((person) => [person.id, person.fullName]));
  const organizationMap = new Map(
    organizations.map((organization) => [
      organization.id,
      organization.tradeName || organization.legalName,
    ]),
  );
  const records = contracts.map((contract) => {
    const learner = learnerMap.get(contract.learnerId);
    return {
      id: contract.id,
      href: `/sistema/contratos/${contract.id}`,
      learner:
        (learner && personMap.get(learner.personId)) ||
        (contract.learnerId === actor.learnerId ? actor.name : learner ? String(learner.registrationNumber) : null) ||
        contract.learnerId,
      company: organizationMap.get(contract.employerId) ?? contract.employerId,
      period: formatPeriod(contract.startDate, contract.endDate),
      workload: formatMinutes(contract.weeklyWorkloadMinutes),
      state: apiLabel(contract.status),
    };
  });
  return (
    <>
      <PageHeader eyebrow="Percurso contratual" title={hasRole(actor, "LEARNER") ? "Meu contrato" : "Contratos"} description="Aprendiz, organizações, período e integridade documental no mesmo contexto." action={can(actor, "contracts:manage") ? <ContractCreator /> : undefined} />
      <DataList key={page.page} pagination={paginationProps(page, query)} statusOptions={contractStatusOptions} selectedStatus={queryValue(query.status) ?? ""} records={records} itemLabel="contrato" searchPlaceholder="Buscar aprendiz ou organização" emptyDescription="Nenhum contrato acessível foi encontrado no backend." columns={[
        { key: "learner", label: "Aprendiz", primary: true },
        { key: "company", label: "Empresa" },
        { key: "period", label: "Período", hideBelow: "lg" },
        { key: "workload", label: "Carga" },
        { key: "state", label: "Situação" },
      ]} />
    </>
  );
}
