import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { ContractCreator } from "@/components/portal/ResourceCreators";
import { can } from "@/domain/auth";
import { hasRole } from "@/domain/auth";
import { apiLabel, formatMinutes, formatPeriod } from "@/lib/api/format";
import { serverApiAll } from "@/lib/api/server";
import type { Person } from "@/lib/api/domain-contracts";
import { requireCapability } from "@/lib/auth/session";
import {
  accessibleContracts,
  accessibleLearners,
  accessibleOrganizations,
} from "@/lib/portal/data";

export default async function ContractsPage() {
  const actor = await requireCapability("contracts:read");
  const [contracts, learners, organizations, people] = await Promise.all([
    accessibleContracts(actor),
    accessibleLearners(actor),
    accessibleOrganizations(actor),
    hasRole(actor, "ADMIN") ? serverApiAll<Person>("/api/people") : Promise.resolve([]),
  ]);
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
        (contract.learnerId === actor.learnerId ? actor.name : learner?.registrationNumber) ||
        contract.learnerId,
      company: organizationMap.get(contract.employerId) ?? contract.employerId,
      period: formatPeriod(contract.startDate, contract.endDate),
      workload: formatMinutes(contract.weeklyWorkloadMinutes),
      state: apiLabel(contract.status),
    };
  });
  return (
    <>
      <PageHeader eyebrow="Percurso contratual" title={hasRole(actor, "LEARNER") ? "Meu contrato" : "Contratos"} description="Aprendiz, organizações, período e integridade documental no mesmo contexto." action={can(actor, "contracts:manage") ? <ContractCreator learners={learners} people={people} organizations={organizations} /> : undefined} />
      <DataList records={records} itemLabel="contrato" searchPlaceholder="Buscar aprendiz ou organização" emptyDescription="Nenhum contrato acessível foi encontrado no backend." columns={[
        { key: "learner", label: "Aprendiz", primary: true },
        { key: "company", label: "Empresa" },
        { key: "period", label: "Período", hideBelow: "lg" },
        { key: "workload", label: "Carga" },
        { key: "state", label: "Situação" },
      ]} />
    </>
  );
}
