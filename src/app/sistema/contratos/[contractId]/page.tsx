import { notFound } from "next/navigation";
import { ContractDocumentManager } from "@/components/portal/ContractDocumentManager";
import {
  DefinitionList,
  EmptyState,
  PageHeader,
  SectionHeading,
  Sheet,
  StatusMark,
} from "@/components/design-system/PortalPrimitives";
import { hasRole } from "@/domain/auth";
import type {
  Contract,
  ContractDocument,
  DocumentType,
  Person,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatCurrency, formatMinutes, formatPeriod } from "@/lib/api/format";
import { serverApiAll, serverApiGetOrNull } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";
import { accessibleLearners, accessibleOrganizations } from "@/lib/portal/data";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const [actor, { contractId }] = await Promise.all([
    requireCapability("contracts:read"),
    params,
  ]);
  const contract = await serverApiGetOrNull<Contract>(
    `/api/contracts/${encodeURIComponent(contractId)}`,
  );
  if (!contract) notFound();

  const admin = hasRole(actor, "ADMIN");
  const [learners, organizations, people, documents, documentTypes] = await Promise.all([
    accessibleLearners(actor),
    accessibleOrganizations(actor),
    admin ? serverApiAll<Person>("/api/people") : Promise.resolve([]),
    admin
      ? serverApiAll<ContractDocument>("/api/contract-documents").then((items) =>
          items.filter((document) => document.contractId === contract.id),
        )
      : Promise.resolve([]),
    admin ? serverApiAll<DocumentType>("/api/document-types") : Promise.resolve([]),
  ]);
  const learner = learners.find((item) => item.id === contract.learnerId);
  const person = learner
    ? people.find((item) => item.id === learner.personId)
    : undefined;
  const organizationMap = new Map(
    organizations.map((organization) => [
      organization.id,
      organization.tradeName || organization.legalName,
    ]),
  );
  const learnerName =
    person?.fullName ||
    (contract.learnerId === actor.learnerId ? actor.name : learner?.registrationNumber) ||
    contract.learnerId;

  return (
    <>
      <PageHeader
        eyebrow="Contrato de aprendizagem"
        title={learnerName}
        description={`${organizationMap.get(contract.employerId) ?? contract.employerId} · ${formatPeriod(contract.startDate, contract.endDate)}`}
        backHref="/sistema/contratos"
        backLabel="Voltar para contratos"
        action={<StatusMark>{apiLabel(contract.status)}</StatusMark>}
      />
      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Sheet>
          <SectionHeading title="Dados contratuais" icon="briefcase" />
          <DefinitionList columns={2} items={[
            { label: "Aprendiz", value: learnerName },
            { label: "Empresa", value: organizationMap.get(contract.employerId) ?? contract.employerId },
            { label: "Escola", value: contract.schoolId ? organizationMap.get(contract.schoolId) ?? contract.schoolId : "Não vinculada" },
            { label: "Período", value: formatPeriod(contract.startDate, contract.endDate) },
            { label: "Carga semanal", value: formatMinutes(contract.weeklyWorkloadMinutes) },
            { label: "Salário mensal", value: formatCurrency(contract.monthlySalary) },
            { label: "Situação", value: <StatusMark>{apiLabel(contract.status)}</StatusMark> },
            { label: "Identificador", value: contract.id, mono: true },
          ]} />
        </Sheet>
        <Sheet accent>
          <SectionHeading title="Referências" description="Identificadores persistidos no backend." icon="layers" />
          <DefinitionList columns={1} items={[
            { label: "Aprendiz", value: contract.learnerId, mono: true },
            { label: "Empresa", value: contract.employerId, mono: true },
            { label: "Escola", value: contract.schoolId || "Não vinculada", mono: Boolean(contract.schoolId) },
          ]} />
        </Sheet>
      </div>
      <div className="mt-5">
        {admin ? <ContractDocumentManager contractId={contract.id} documents={documents} documentTypes={documentTypes} /> : <Sheet><EmptyState title="Documentos contratuais protegidos" description="O backend restringe versões e binários contratuais à administração." icon="shield" /></Sheet>}
      </div>
    </>
  );
}
