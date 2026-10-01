import { contractDocumentPage } from "@/lib/documents/pagination";
import { paginationProps, type ListQuery } from "@/lib/pagination";
import { notFound } from "next/navigation";
import { ContractDocumentManager } from "@/components/portal/ContractDocumentManager";
import { DetailTabs } from "@/components/portal/DetailTabs";
import { ContractLifecycleManager } from "@/components/portal/LifecycleManagers";
import { ContractEditor } from "@/components/portal/EntityEditors";
import {
  DefinitionList,
  EmptyState,
  PageHeader,
  SectionHeading,
  Sheet,
  StatusMark,
} from "@/components/design-system/PortalPrimitives";
import { hasRole } from "@/domain/auth";
import { relatedRecords } from "@/lib/api/related";
import type { UserResponse } from "@/lib/api/contracts";
import type {
  Contract,
  DocumentType,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatCurrency, formatDateTime, formatMinutes, formatPeriod, formatLearnerName } from "@/lib/api/format";
import { serverApiAll, serverApiGetOrNull } from "@/lib/api/server";
import { requireCapability } from "@/lib/auth/session";
import { firstQueryValue } from "@/lib/documents/navigation";

export default async function ContractDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ contractId: string }>;
  searchParams: Promise<ListQuery>;
}) {
  const [actor, { contractId }, query] = await Promise.all([
    requireCapability("contracts:read"),
    params,
    searchParams,
  ]);
  const contract = await serverApiGetOrNull<Contract>(
    `/api/contracts/${encodeURIComponent(contractId)}`,
  );
  if (!contract) notFound();

  const admin = hasRole(actor, "ADMIN");
  const tab = firstQueryValue(query.tab) === "documentos" ? "documentos" : "dados";
  const [documentResult, documentTypes, historyUsers] = await Promise.all([
    admin && tab === "documentos"
      ? contractDocumentPage(contract.id, query)
      : Promise.resolve(null),
    admin && tab === "documentos" ? serverApiAll<DocumentType>("/api/document-types") : Promise.resolve([]),
    admin && tab === "dados"
      ? relatedRecords<UserResponse>("users", contract.schoolHistory?.map((change) => change.changedByUserId) ?? [])
      : Promise.resolve([]),
  ]);
  const userNames = new Map(historyUsers.map((user) => [user.id, user.displayName]));
  const organizationNames = {
    [contract.employerId]: contract.employerName,
    ...(contract.schoolId && contract.schoolName ? { [contract.schoolId]: contract.schoolName } : {}),
  };
  const learnerName = formatLearnerName(contract.learnerName, contract.learnerRegistrationNumber);
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <>
      <PageHeader
        eyebrow="Contrato de aprendizagem"
        title={learnerName}
        description={`${contract.employerName} · ${formatPeriod(contract.startDate, contract.endDate)}`}
        backHref="/sistema/contratos"
        backLabel="Voltar para contratos"
        action={<StatusMark>{apiLabel(contract.status)}</StatusMark>}
      />
      <DetailTabs activeTab={tab} tabs={[{ id: "dados", label: "Dados contratuais" }, { id: "documentos", label: "Documentos" }]} label="Seções do contrato" />
      {tab === "dados" ? <>
      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Sheet>
          <SectionHeading title="Dados contratuais" icon="briefcase" action={admin ? <ContractEditor contract={contract} learnerName={learnerName} organizationNames={organizationNames} /> : undefined} />
          <DefinitionList columns={2} items={[
            { label: "Aprendiz", value: learnerName },
            { label: "Empresa", value: contract.employerName },
            { label: "Escola", value: contract.schoolName || "Não vinculada" },
            { label: "Período", value: formatPeriod(contract.startDate, contract.endDate) },
            { label: "Carga semanal", value: formatMinutes(contract.weeklyWorkloadMinutes) },
            { label: "Salário mensal", value: formatCurrency(contract.monthlySalary) },
            { label: "Situação", value: <StatusMark>{apiLabel(contract.status)}</StatusMark> },
          ]} />
        </Sheet>
        <Sheet accent>
          <SectionHeading title="Vínculos" icon="layers" />
          <DefinitionList columns={1} items={[
            { label: "Aprendiz", value: learnerName },
            { label: "Matrícula", value: String(contract.learnerRegistrationNumber), mono: true },
            { label: "Empresa", value: contract.employerName },
            { label: "Escola", value: contract.schoolName || "Não vinculada" },
          ]} />
        </Sheet>
      </div>
      {contract.schoolHistory?.length ? <div className="mt-5"><Sheet><SectionHeading title="Histórico de escola" description="Cada alteração mantém a escola anterior, a nova escola e o momento da mudança." icon="building" /><div className="divide-y divide-[var(--inat-line)]">{[...contract.schoolHistory].reverse().map((change) => <div key={change.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"><div><p className="font-semibold">{change.previousSchoolId ? change.previousSchoolName || "Escola indisponível" : "Sem escola"} → {change.newSchoolId ? change.newSchoolName || "Escola indisponível" : "Sem escola"}</p>{change.changedByUserId && userNames.has(change.changedByUserId) ? <p className="mt-1 text-xs text-[var(--inat-muted)]">Alterado por {userNames.get(change.changedByUserId)}</p> : null}</div><time className="text-xs text-[var(--inat-muted)]">{formatDateTime(change.changedAt)}</time></div>)}</div></Sheet></div> : null}
      {admin ? <div className="mt-5"><ContractLifecycleManager contract={contract} today={today} /></div> : null}
      </> : admin ? <ContractDocumentManager key={`${contract.id}:${documentResult?.page.page}:${firstQueryValue(query.document) ?? ""}`} contractId={contract.id} contractStatus={contract.status} documents={documentResult?.page.content ?? []} focusedDocument={documentResult?.focusedDocument} pagination={documentResult ? paginationProps(documentResult.page, { ...query, document: undefined, tab: "documentos" }) : undefined} documentTypes={documentTypes} initialDocumentId={firstQueryValue(query.document)} /> : <Sheet><EmptyState title="Documentos contratuais protegidos" description="O backend restringe versões e binários contratuais à administração." icon="shield" /></Sheet>}
    </>
  );
}
