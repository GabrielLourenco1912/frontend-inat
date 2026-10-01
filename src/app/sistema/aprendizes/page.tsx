import { paginationProps, queryValue, type ListPageProps } from "@/lib/pagination";
import { recordStatusOptions } from "@/lib/status-filters";
import { accessibleLearnersPage } from "@/lib/portal/pagination";
import { DataList } from "@/components/design-system/DataList";
import { PageHeader } from "@/components/design-system/PortalPrimitives";
import { LearnerOnboardingCreator } from "@/components/portal/ResourceCreators";
import { can } from "@/domain/auth";
import { hasRole } from "@/domain/auth";
import { apiLabel, formatLearnerName } from "@/lib/api/format";
import { serverApiAll } from "@/lib/api/server";
import type {
  Cohort,
  CohortEnrollment,
  Contract,
  Organization,
} from "@/lib/api/domain-contracts";
import { requireCapability } from "@/lib/auth/session";

export default async function LearnersPage({ searchParams }: ListPageProps) {
  const query = await searchParams ?? {};
  const actor = await requireCapability("learners:read");
  const admin = hasRole(actor, "ADMIN");
  const [page, contracts, enrollments, cohorts, organizations] = await Promise.all([
    accessibleLearnersPage(actor, query),
    admin ? serverApiAll<Contract>("/api/contracts") : Promise.resolve([]),
    admin ? serverApiAll<CohortEnrollment>("/api/cohort-enrollments") : Promise.resolve([]),
    admin ? serverApiAll<Cohort>("/api/cohorts") : Promise.resolve([]),
    admin ? serverApiAll<Organization>("/api/organizations") : Promise.resolve([]),
  ]);
  const learners = page.content;
  const contractById = new Map(contracts.map((contract) => [contract.id, contract]));
  const cohortMap = new Map(cohorts.map((cohort) => [cohort.id, cohort.code]));
  const organizationMap = new Map(
    organizations.map((organization) => [
      organization.id,
      organization.tradeName || organization.legalName,
    ]),
  );
  const enrollmentByLearner = new Map<string, CohortEnrollment>();
  for (const enrollment of enrollments) {
    const contract = contractById.get(enrollment.contractId);
    if (contract && !enrollmentByLearner.has(contract.learnerId)) {
      enrollmentByLearner.set(contract.learnerId, enrollment);
    }
  }
  const records = learners.map((learner) => {
    const contract = contracts.find((item) => item.learnerId === learner.id);
    const enrollment = enrollmentByLearner.get(learner.id);
    return {
    id: learner.id,
    href: `/sistema/aprendizes/${learner.id}`,
    name: formatLearnerName(learner.fullName, learner.registrationNumber),
    registration: String(learner.registrationNumber),
    education: learner.hasCompletedHighSchool ? "Ensino médio concluído" : "Ensino médio em curso",
    cohort: enrollment ? cohortMap.get(enrollment.cohortId) ?? "Turma indisponível" : "Sem turma",
    company: contract
      ? contract.employerName || organizationMap.get(contract.employerId) || "Empresa indisponível"
      : "Sem contrato",
    state: apiLabel(learner.status),
  };
  });

  return (
    <>
      <PageHeader
        eyebrow="Pessoas e percurso"
        title={hasRole(actor, "LEARNER") ? "Meu percurso" : "Aprendizes"}
        description={hasRole(actor, "EMPLOYER_MANAGER") ? "Aprendizes com contrato ativo ou histórico autorizado na sua organização." : "Matrícula, escolaridade, turma e situação acadêmica em uma visão contextual."}
        action={can(actor, "learners:manage") ? <LearnerOnboardingCreator /> : undefined}
      />
      <DataList key={page.page} pagination={paginationProps(page, query)} statusOptions={recordStatusOptions} selectedStatus={queryValue(query.status) ?? ""}
        records={records}
        itemLabel="aprendiz"
        searchPlaceholder="Buscar por nome ou matrícula"
        emptyDescription="Nenhum aprendiz acessível foi encontrado no backend."
        columns={[
          { key: "name", label: "Aprendiz", primary: true },
          { key: "registration", label: "Matrícula", mono: true },
          { key: "education", label: "Escolaridade", hideBelow: "lg" },
          { key: "cohort", label: "Turma", mono: true },
          { key: "company", label: "Empresa", hideBelow: "lg" },
          { key: "state", label: "Situação" },
        ]}
      />
    </>
  );
}
