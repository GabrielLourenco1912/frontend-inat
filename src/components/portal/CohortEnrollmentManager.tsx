"use client";

import { SearchSelect } from "@/components/design-system/SearchSelect";

import { PaginatedContent } from "@/components/design-system/ClientPagination";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { EmptyState, SectionHeading, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import { deleteResource, postJson, putJson, requestErrorMessage } from "@/lib/api/client";
import type {
  Cohort,
  CohortEnrollment,
  Contract,
  EnrollmentStatus,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatPeriod } from "@/lib/api/format";

type ContractOption = { contract: Contract; label: string };

export function CohortEnrollmentManager({
  cohort,
  enrollments,
  contractOptions,
  today,
}: {
  cohort: Cohort;
  enrollments: CohortEnrollment[];
  contractOptions: ContractOption[];
  today: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const contractMap = new Map(contractOptions.map((option) => [option.contract.id, option]));
  const reservedCount = enrollments.filter((enrollment) =>
    enrollment.status === "PENDING" || enrollment.status === "ACTIVE"
  ).length;
  const cohortOpen = cohort.status === "PLANNED" || cohort.status === "ACTIVE";
  const hasCapacity = cohort.maxLearners == null || reservedCount < cohort.maxLearners;
  const canCreate = cohortOpen && hasCapacity;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await postJson<CohortEnrollment>("/api/backend/cohort-enrollments", {
        contractId: String(form.get("contractId") ?? ""),
        cohortId: cohort.id,
        startDate: String(form.get("startDate") ?? ""),
        endDate: String(form.get("endDate") ?? "") || null,
        status: "PENDING",
        statusReason: null,
      });
      setOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível criar a matrícula."));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(enrollment: CohortEnrollment, status: EnrollmentStatus) {
    let reason: string | null = null;
    if (status === "CANCELLED") {
      reason = window.prompt("Informe o motivo do cancelamento da matrícula:")?.trim() || null;
      if (!reason) return;
    }
    setSaving(true);
    setError("");
    try {
      await putJson<CohortEnrollment>(
        `/api/backend/cohort-enrollments/${encodeURIComponent(enrollment.id)}`,
        {
          contractId: enrollment.contractId,
          cohortId: enrollment.cohortId,
          startDate: enrollment.startDate,
          endDate: enrollment.endDate,
          status,
          statusReason: reason,
        },
      );
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível alterar a matrícula."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(enrollment: CohortEnrollment) {
    if (!window.confirm("Remover esta matrícula pendente da turma?")) return;
    setError("");
    try {
      await deleteResource(`/api/backend/cohort-enrollments/${encodeURIComponent(enrollment.id)}`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível remover a matrícula."));
    }
  }

  return <>
    <Sheet>
      <SectionHeading
        title="Matrículas da turma"
        description="Novas matrículas nascem pendentes. As identidades ficam imutáveis e pendentes/ativas reservam vaga."
        icon="graduation"
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!canCreate}
            title={!cohortOpen ? "Turmas concluídas ou canceladas não recebem matrículas." : !hasCapacity ? "A capacidade da turma foi atingida." : undefined}
            className="portal-button portal-button-primary h-9 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Icon name="plus" className="size-4" />Matricular
          </button>
        }
      />
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-[var(--inat-line)] px-5 py-3 text-xs text-[var(--inat-muted)]">
        <span>{reservedCount} vaga(s) reservada(s)</span>
        <span>{cohort.maxLearners == null ? "Sem limite definido" : `Capacidade: ${cohort.maxLearners}`}</span>
      </div>
      {error ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {enrollments.length ? <div className="divide-y divide-[var(--inat-line)]"><PaginatedContent>{enrollments.map((enrollment) => {
        const option = contractMap.get(enrollment.contractId);
        const contract = option?.contract;
        const canActivate = enrollment.status === "PENDING"
          && cohort.status === "ACTIVE"
          && contract?.status === "ACTIVE"
          && enrollment.startDate <= today
          && (!enrollment.endDate || enrollment.endDate >= today);
        const canComplete = enrollment.status === "ACTIVE"
          && Boolean(enrollment.endDate && enrollment.endDate < today);
        const canCancel = enrollment.status === "PENDING" || enrollment.status === "ACTIVE";
        return <div key={enrollment.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
          <Link href={`/sistema/aprendizes/${enrollment.learnerId}`} className="hover:text-[var(--inat-teal-dark)]">
            <p className="text-sm font-semibold">{option?.label ?? enrollment.learnerId}</p>
            <p className="mt-1 text-xs text-[var(--inat-muted)]">{formatPeriod(enrollment.startDate, enrollment.endDate)} · contrato {enrollment.contractId}</p>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusMark>{apiLabel(enrollment.status)}</StatusMark>
            {enrollment.status === "PENDING" ? <button type="button" disabled={saving || !canActivate} title={!canActivate ? "Exige turma, contrato, aprendiz e período ativos." : undefined} onClick={() => void updateStatus(enrollment, "ACTIVE")} className="portal-button portal-button-quiet h-9 disabled:cursor-not-allowed disabled:opacity-40">Ativar</button> : null}
            {enrollment.status === "ACTIVE" ? <button type="button" disabled={saving || !canComplete} title={!canComplete ? "A conclusão exige que a data final já tenha passado." : undefined} onClick={() => void updateStatus(enrollment, "COMPLETED")} className="portal-button portal-button-quiet h-9 disabled:cursor-not-allowed disabled:opacity-40">Concluir</button> : null}
            {canCancel ? <button type="button" disabled={saving} onClick={() => void updateStatus(enrollment, "CANCELLED")} className="portal-button portal-button-quiet h-9 text-rose-700">Cancelar</button> : null}
            {enrollment.status === "PENDING" ? <button type="button" disabled={saving} onClick={() => void remove(enrollment)} className="portal-button portal-button-quiet h-9 text-rose-700" aria-label="Excluir matrícula pendente"><Icon name="trash" className="size-4" /></button> : null}
          </div>
        </div>;
      })}</PaginatedContent></div> : <EmptyState title="Nenhuma matrícula" description="Nenhum contrato foi matriculado nesta turma." icon="graduation" />}
    </Sheet>

    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><form onSubmit={submit} className="w-full max-w-lg border border-[var(--inat-line)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Matricular contrato</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-xl">×</button></div>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<p className="mt-4 border-l-[3px] border-[var(--inat-teal)] bg-[var(--inat-mist)] p-3 text-sm leading-6">A matrícula será criada como pendente e poderá ser ativada quando contrato, turma e período estiverem ativos.</p><div className="mt-5 grid gap-4"><label><span className="portal-label">Contrato / aprendiz</span><SearchSelect name="contractId" label="Contrato ou aprendiz" endpoint="/api/backend/lookups/contracts?purpose=enrollment" required /></label><label><span className="portal-label">Data inicial</span><input name="startDate" type="date" min={cohort.startDate} max={cohort.endDate ?? undefined} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Data final (opcional)</span><input name="endDate" type="date" min={cohort.startDate} max={cohort.endDate ?? undefined} className="portal-field mt-2 h-10 w-full px-3" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving || !canCreate} className="portal-button portal-button-primary">{saving ? "Matriculando..." : "Matricular como pendente"}</button></div></form></div> : null}
  </>;
}
