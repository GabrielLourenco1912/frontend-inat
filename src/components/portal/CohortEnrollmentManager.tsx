"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { EmptyState, SectionHeading, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import { deleteResource, postJson, requestErrorMessage } from "@/lib/api/client";
import type { CohortEnrollment, Contract, EnrollmentStatus } from "@/lib/api/domain-contracts";
import { apiLabel, formatPeriod } from "@/lib/api/format";

type ContractOption = { contract: Contract; label: string };

export function CohortEnrollmentManager({ cohortId, enrollments, contractOptions }: { cohortId: string; enrollments: CohortEnrollment[]; contractOptions: ContractOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const contractMap = new Map(contractOptions.map((option) => [option.contract.id, option]));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await postJson<CohortEnrollment>("/api/backend/cohort-enrollments", {
        contractId: String(form.get("contractId") ?? ""),
        cohortId,
        startDate: String(form.get("startDate") ?? ""),
        endDate: String(form.get("endDate") ?? "") || null,
        status: String(form.get("status") ?? "ACTIVE") as EnrollmentStatus,
      });
      setOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível criar a matrícula."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(enrollment: CohortEnrollment) {
    if (!window.confirm("Remover esta matrícula da turma?")) return;
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
      <SectionHeading title="Matrículas da turma" description="A matrícula usa um contrato existente e preserva o histórico de remanejamentos." icon="graduation" action={<button type="button" onClick={() => setOpen(true)} className="portal-button portal-button-primary h-9"><Icon name="plus" className="size-4" />Matricular</button>} />
      {error ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {enrollments.length ? <div className="divide-y divide-[var(--inat-line)]">{enrollments.map((enrollment) => { const option = contractMap.get(enrollment.contractId); return <div key={enrollment.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"><Link href={`/sistema/aprendizes/${enrollment.learnerId}`} className="hover:text-[var(--inat-teal-dark)]"><p className="text-sm font-semibold">{option?.label ?? enrollment.learnerId}</p><p className="mt-1 text-xs text-[var(--inat-muted)]">{formatPeriod(enrollment.startDate, enrollment.endDate)} · contrato {enrollment.contractId}</p></Link><div className="flex items-center gap-2"><StatusMark>{apiLabel(enrollment.status)}</StatusMark><button type="button" onClick={() => remove(enrollment)} className="portal-button portal-button-quiet h-9 text-rose-700" aria-label="Remover matrícula"><Icon name="trash" className="size-4" /></button></div></div>; })}</div> : <EmptyState title="Nenhuma matrícula" description="Nenhum contrato foi matriculado nesta turma." icon="graduation" />}
    </Sheet>

    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><form onSubmit={submit} className="w-full max-w-lg border border-[var(--inat-line)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Matricular contrato</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-xl">×</button></div>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<div className="mt-5 grid gap-4"><label><span className="portal-label">Contrato / aprendiz</span><select name="contractId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3" required><option value="" disabled>Selecione</option>{contractOptions.map((option) => <option key={option.contract.id} value={option.contract.id}>{option.label}</option>)}</select></label><label><span className="portal-label">Data inicial</span><input name="startDate" type="date" className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Data final (opcional)</span><input name="endDate" type="date" className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Situação</span><select name="status" defaultValue="ACTIVE" className="portal-field mt-2 h-10 w-full px-3"><option value="PENDING">Pendente</option><option value="ACTIVE">Ativa</option><option value="COMPLETED">Concluída</option><option value="CANCELLED">Cancelada</option></select></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving || !contractOptions.length} className="portal-button portal-button-primary">{saving ? "Matriculando..." : "Matricular"}</button></div></form></div> : null}
  </>;
}
