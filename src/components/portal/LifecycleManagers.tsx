"use client";

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

function addOneDay(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function History({ entries }: { entries: LifecycleStatusHistory[] }) {
  return entries.length ? (
    <ol className="divide-y divide-[var(--inat-line)] border-t border-[var(--inat-line)]">
      {[...entries].reverse().map((entry) => (
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
  const [endDate, setEndDate] = useState(contract.endDate ?? "");
  const terminal = contract.status === "ENDED" || contract.status === "CANCELLED";
  const todayInsidePeriod = contract.startDate <= today && (!contract.endDate || contract.endDate >= today);
  const canEnd = Boolean(contract.endDate && contract.endDate < today);
  const minimumEndDate = contract.endDate && contract.endDate >= today
    ? addOneDay(contract.endDate)
    : addOneDay(today);

  async function save(status: ContractStatus, statusReason: string | null, requestedEnd = contract.endDate) {
    setSaving(true);
    setError("");
    try {
      await putJson<Contract>(`/api/backend/contracts/${encodeURIComponent(contract.id)}`, {
        learnerId: contract.learnerId,
        employerId: contract.employerId,
        schoolId: contract.schoolId,
        startDate: contract.startDate,
        endDate: requestedEnd,
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
        description="Identidade e data inicial são permanentes. A data final só pode ser estendida; o cancelamento encerra o contrato na data atual."
        icon="shield"
        action={<StatusMark>{apiLabel(contract.status)}</StatusMark>}
      />
      {error ? <p role="alert" className="mx-5 mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {!terminal ? (
        <div className="grid gap-5 p-5 lg:grid-cols-2">
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save(contract.status, null, endDate || null);
            }}
          >
            <label>
              <span className="portal-label">Nova data final</span>
              <input
                type="date"
                value={endDate}
                min={minimumEndDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="portal-field mt-2 h-10 w-full px-3"
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">
              Use uma data futura posterior à atual. Deixar vazio transforma um prazo finito em indeterminado.
            </p>
            <button
              type="submit"
              disabled={saving || endDate === (contract.endDate ?? "")}
              className="portal-button portal-button-primary mt-3 h-9 disabled:opacity-45"
            >
              Salvar prazo
            </button>
          </form>
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
  const [capacity, setCapacity] = useState(cohort.maxLearners?.toString() ?? "");
  const terminal = cohort.status === "COMPLETED" || cohort.status === "CANCELLED";
  const todayInsidePeriod = cohort.startDate <= today && (!cohort.endDate || cohort.endDate >= today);
  const canComplete = Boolean(cohort.endDate && cohort.endDate < today && !hasOpenLessons);

  async function save(status: CohortStatus, statusReason: string | null, maxLearners = cohort.maxLearners) {
    setSaving(true);
    setError("");
    try {
      await putJson<Cohort>(`/api/backend/cohorts/${encodeURIComponent(cohort.id)}`, {
        code: cohort.code,
        name: cohort.name,
        defaultWeekday: cohort.defaultWeekday,
        shiftCode: cohort.shiftCode,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
        maxLearners,
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
            onSubmit={(event) => {
              event.preventDefault();
              void save(cohort.status, null, capacity ? Number(capacity) : null);
            }}
          >
            <label>
              <span className="portal-label">Capacidade de aprendizes</span>
              <input type="number" min={Math.max(1, reservedCount)} value={capacity} onChange={(event) => setCapacity(event.target.value)} className="portal-field mt-2 h-10 w-full px-3" />
            </label>
            <p className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">
              Matrículas pendentes e ativas reservam vaga; o limite não pode ficar abaixo de {reservedCount}.
            </p>
            <button type="submit" disabled={saving || capacity === (cohort.maxLearners?.toString() ?? "")} className="portal-button portal-button-primary mt-3 h-9 disabled:opacity-45">Salvar capacidade</button>
          </form>
        </div>
      ) : <p className="px-5 py-4 text-sm text-[var(--inat-muted)]">Turmas concluídas ou canceladas são somente leitura.</p>}
      <History entries={cohort.statusHistory ?? []} />
    </Sheet>
  );
}
