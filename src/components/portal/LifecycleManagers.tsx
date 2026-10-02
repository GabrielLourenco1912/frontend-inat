"use client";

import { useClientPagination } from "@/components/design-system/ClientPagination";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SectionHeading, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import { putJson, requestErrorMessage } from "@/lib/api/client";
import type {
  Cohort,
  CohortStatus,
  Contract,
  ContractStatus,
  LifecycleStatusHistory,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime } from "@/lib/api/format";

function History({ entries }: { entries: LifecycleStatusHistory[] }) {
  const page = useClientPagination([...entries].reverse());
  return entries.length ? (
    <>
    <ol className="divide-y divide-[var(--inat-line)] border-t border-[var(--inat-line)]">
      {page.items.map((entry) => (
        <li key={entry.id} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[1fr_auto]">
          <div>
            <p className="font-semibold">
              {entry.previousStatus ? `${apiLabel(entry.previousStatus)} → ` : ""}
              {apiLabel(entry.newStatus)}
            </p>
            {entry.reasonDetail ? <p className="mt-1 text-[var(--inat-muted)]">{entry.reasonDetail}</p> : null}
          </div>
          <time className="text-xs text-[var(--inat-muted)]">{formatDateTime(entry.changedAt)}</time>
        </li>
      ))}
    </ol>
    {page.controls}
    </>
  ) : (
    <p className="border-t border-[var(--inat-line)] px-5 py-4 text-sm text-[var(--inat-muted)]">
      Nenhuma mudança de situação foi registrada ainda.
    </p>
  );
}

export function ContractLifecycleManager({
  contract,
  today,
}: {
  contract: Contract;
  today: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const terminal = contract.status === "ENDED" || contract.status === "CANCELLED";
  const todayInsidePeriod = contract.startDate <= today && (!contract.endDate || contract.endDate >= today);
  const canEnd = Boolean(contract.endDate && contract.endDate < today);

  async function save(status: ContractStatus, statusReason: string | null) {
    setSaving(true);
    setError("");
    try {
      await putJson<Contract>(`/api/backend/contracts/${encodeURIComponent(contract.id)}`, {
        learnerId: contract.learnerId,
        employerId: contract.employerId,
        schoolId: contract.schoolId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlySalary: contract.monthlySalary,
        weeklyWorkloadMinutes: contract.weeklyWorkloadMinutes,
        status,
        statusReason,
      });
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível alterar o contrato."));
    } finally {
      setSaving(false);
    }
  }

  function transition(status: ContractStatus) {
    let reason: string | null = null;
    if (status === "SUSPENDED" || status === "CANCELLED") {
      reason = window.prompt(
        status === "CANCELLED" ? "Informe o motivo do cancelamento:" : "Informe o motivo da suspensão:",
      )?.trim() || null;
      if (!reason) return;
    }
    void save(status, reason);
  }

  const transitions: Array<{ status: ContractStatus; label: string; disabled?: boolean; title?: string }> = [];
  if (contract.status === "DRAFT") {
    transitions.push({ status: "ACTIVE", label: "Ativar", disabled: !todayInsidePeriod, title: "A ativação exige que hoje esteja dentro do período." });
    transitions.push({ status: "CANCELLED", label: "Cancelar" });
  } else if (contract.status === "ACTIVE") {
    transitions.push({ status: "SUSPENDED", label: "Suspender" });
    transitions.push({ status: "ENDED", label: "Encerrar", disabled: !canEnd, title: "O encerramento exige que a data final já tenha passado." });
    transitions.push({ status: "CANCELLED", label: "Cancelar" });
  } else if (contract.status === "SUSPENDED") {
    transitions.push({ status: "ACTIVE", label: "Reativar", disabled: !todayInsidePeriod, title: "A reativação exige que hoje esteja dentro do período." });
    transitions.push({ status: "ENDED", label: "Encerrar", disabled: !canEnd, title: "O encerramento exige que a data final já tenha passado." });
    transitions.push({ status: "CANCELLED", label: "Cancelar" });
  }

  return (
    <Sheet>
      <SectionHeading
        title="Ciclo de vida do contrato"
        description="Use as transições para preservar o histórico administrativo do contrato."
        icon="shield"
        action={<StatusMark>{apiLabel(contract.status)}</StatusMark>}
      />
      {error ? <p role="alert" className="mx-5 mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {!terminal ? (
        <div className="p-5">
          <div>
            <p className="portal-label">Transições permitidas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {transitions.map((item) => (
                <button
                  key={item.status}
                  type="button"
                  disabled={saving || item.disabled}
                  title={item.disabled ? item.title : undefined}
                  onClick={() => transition(item.status)}
                  className={`portal-button h-9 disabled:cursor-not-allowed disabled:opacity-45 ${item.status === "CANCELLED" ? "portal-button-quiet text-rose-700" : "portal-button-secondary"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="px-5 py-4 text-sm text-[var(--inat-muted)]">
          Contratos encerrados ou cancelados são somente leitura e preservam seus documentos.
        </p>
      )}
      <History entries={contract.statusHistory ?? []} />
    </Sheet>
  );
}

export function CohortLifecycleManager({
  cohort,
  today,
  hasOpenLessons,
  reservedCount,
}: {
  cohort: Cohort;
  today: string;
  hasOpenLessons: boolean;
  reservedCount: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const terminal = cohort.status === "COMPLETED" || cohort.status === "CANCELLED";
  const todayInsidePeriod = cohort.startDate <= today && (!cohort.endDate || cohort.endDate >= today);
  const canComplete = Boolean(cohort.endDate && cohort.endDate < today && !hasOpenLessons);

  async function save(status: CohortStatus, statusReason: string | null, values?: FormData) {
    setSaving(true);
    setError("");
    try {
      await putJson<Cohort>(`/api/backend/cohorts/${encodeURIComponent(cohort.id)}`, {
        code: values && cohort.status === "PLANNED" ? String(values.get("code") ?? "").trim().toUpperCase() : cohort.code,
        name: values ? String(values.get("name")) : cohort.name,
        defaultWeekday: values ? Number(values.get("defaultWeekday")) : cohort.defaultWeekday,
        shiftCode: values ? String(values.get("shiftCode") ?? "").trim().toUpperCase() : cohort.shiftCode,
        startDate: values ? String(values.get("startDate")) : cohort.startDate,
        endDate: values ? String(values.get("endDate") ?? "") || null : cohort.endDate,
        maxLearners: values ? String(values.get("maxLearners") ?? "") ? Number(values.get("maxLearners")) : null : cohort.maxLearners,
        status,
        statusReason,
      });
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível alterar a turma."));
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    const reason = window.prompt("Informe o motivo do cancelamento da turma:")?.trim();
    if (reason) void save("CANCELLED", reason);
  }

  return (
    <Sheet>
      <SectionHeading
        title="Ciclo de vida da turma"
        description="O cancelamento também cancela matrículas abertas, aulas abertas, atividades e lembretes relacionados."
        icon="shield"
        action={<StatusMark>{apiLabel(cohort.status)}</StatusMark>}
      />
      {error ? <p role="alert" className="mx-5 mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {!terminal ? (
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div>
            <p className="portal-label">Transições permitidas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cohort.status === "PLANNED" ? <button type="button" disabled={saving || !todayInsidePeriod} title={!todayInsidePeriod ? "A ativação exige que hoje esteja dentro do período." : undefined} onClick={() => void save("ACTIVE", null)} className="portal-button portal-button-secondary h-9 disabled:cursor-not-allowed disabled:opacity-45">Ativar</button> : null}
              {cohort.status === "ACTIVE" ? <button type="button" disabled={saving || !canComplete} title={!canComplete ? "A conclusão exige prazo encerrado e nenhuma aula aberta." : undefined} onClick={() => void save("COMPLETED", null)} className="portal-button portal-button-secondary h-9 disabled:cursor-not-allowed disabled:opacity-45">Concluir</button> : null}
              <button type="button" disabled={saving} onClick={cancel} className="portal-button portal-button-quiet h-9 text-rose-700 disabled:opacity-45">Cancelar</button>
            </div>
          </div>
          <form
            onSubmit={(event) => { event.preventDefault(); void save(cohort.status, null, new FormData(event.currentTarget)); }}
            className="grid gap-4 sm:grid-cols-2 lg:col-span-2"
          >
            <label><span className="portal-label">Código</span><input name="code" defaultValue={cohort.code} disabled={cohort.status !== "PLANNED"} required className="portal-field mt-2 h-10 w-full px-3 disabled:bg-[var(--inat-paper)]" />{cohort.status !== "PLANNED" ? <input type="hidden" name="code" value={cohort.code} /> : null}</label>
            <label><span className="portal-label">Nome</span><input name="name" defaultValue={cohort.name} required className="portal-field mt-2 h-10 w-full px-3" /></label>
            <label><span className="portal-label">Dia padrão</span><select name="defaultWeekday" defaultValue={cohort.defaultWeekday} className="portal-field mt-2 h-10 w-full px-3"><option value="1">Segunda</option><option value="2">Terça</option><option value="3">Quarta</option><option value="4">Quinta</option><option value="5">Sexta</option><option value="6">Sábado</option><option value="7">Domingo</option></select></label>
            <label><span className="portal-label">Turno</span><input name="shiftCode" defaultValue={cohort.shiftCode} required className="portal-field mt-2 h-10 w-full px-3" /></label>
            <label><span className="portal-label">Início</span><input name="startDate" type="date" defaultValue={cohort.startDate} required className="portal-field mt-2 h-10 w-full px-3" /></label>
            <label><span className="portal-label">Término</span><input name="endDate" type="date" defaultValue={cohort.endDate ?? ""} className="portal-field mt-2 h-10 w-full px-3" /></label>
            <label><span className="portal-label">Capacidade</span><input name="maxLearners" type="number" min={Math.max(1, reservedCount)} defaultValue={cohort.maxLearners ?? ""} className="portal-field mt-2 h-10 w-full px-3" /></label>
            <div className="flex items-end"><button type="submit" disabled={saving} className="portal-button portal-button-primary h-10 disabled:opacity-45">Salvar dados da turma</button></div>
            <p className="text-xs leading-5 text-[var(--inat-muted)] sm:col-span-2">A capacidade não pode ficar abaixo das {reservedCount} vagas já reservadas. O código fica fixo após a ativação.</p>
          </form>
        </div>
      ) : <p className="px-5 py-4 text-sm text-[var(--inat-muted)]">Turmas concluídas ou canceladas são somente leitura.</p>}
      <History entries={cohort.statusHistory ?? []} />
    </Sheet>
  );
}
