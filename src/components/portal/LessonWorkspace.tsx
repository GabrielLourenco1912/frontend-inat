"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "@/components/design-system/Icon";
import { ExternalLessonPlayer } from "@/components/portal/ExternalLessonPlayer";
import {
  DefinitionList,
  EmptyState,
  PageHeader,
  SectionHeading,
  Sheet,
  StatusMark,
} from "@/components/design-system/PortalPrimitives";
import {
  deleteResource,
  postJson,
  putJson,
  requestErrorMessage,
} from "@/lib/api/client";
import type {
  Activity,
  AttendanceRecord,
  AttendanceStatus,
  DeliveryMode,
  Lesson,
  LessonParticipant,
  LessonStatus,
  ParticipationStatus,
  ParticipationType,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime, formatTime } from "@/lib/api/format";

type Tab = "resumo" | "participantes" | "chamada" | "atividades" | "historico";
type LearnerOption = { id: string; label: string };
type AttendanceDraft = {
  participant: LessonParticipant;
  recordId?: string;
  status: AttendanceStatus | "";
  checkInAt: string;
  checkOutAt: string;
  notes: string;
};

const attendanceOptions: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "EXCUSED",
  "LATE",
  "PARTIAL",
];

function localInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function isoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function RestrictionNotice({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-[3px] border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
      {children}
    </div>
  );
}

function ParticipantCreator({
  lessonId,
  learnerOptions,
}: {
  lessonId: string;
  learnerOptions: LearnerOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await postJson<LessonParticipant>("/api/backend/lesson-participants", {
        lessonId,
        learnerId: String(form.get("learnerId") ?? ""),
        sourceEnrollmentId: null,
        participationType: String(
          form.get("participationType") ?? "EXTRA",
        ) as ParticipationType,
        status: "EXPECTED" as ParticipationStatus,
        assignmentReason: String(form.get("assignmentReason") ?? "").trim(),
      });
      setOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(
        requestErrorMessage(
          requestError,
          "Não foi possível incluir o participante.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="portal-button portal-button-secondary h-9"
      >
        <Icon name="plus" className="size-4" />
        Incluir participante
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="participant-form-title"
        >
          <form
            onSubmit={submit}
            className="w-full max-w-lg border border-[var(--inat-line)] bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 id="participant-form-title" className="text-lg font-semibold">
                Incluir participante
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xl"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            {error ? (
              <p
                role="alert"
                className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
              >
                {error}
              </p>
            ) : null}
            <div className="mt-5 grid gap-4">
              <label>
                <span className="portal-label">Aprendiz</span>
                {learnerOptions.length ? (
                  <select
                    name="learnerId"
                    defaultValue=""
                    className="portal-field mt-2 h-10 w-full px-3"
                    required
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {learnerOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="learnerId"
                    className="portal-field mt-2 h-10 w-full px-3"
                    placeholder="ID do aprendiz"
                    required
                  />
                )}
              </label>
              <label>
                <span className="portal-label">Tipo</span>
                <select
                  name="participationType"
                  defaultValue="EXTRA"
                  className="portal-field mt-2 h-10 w-full px-3"
                >
                  <option value="MAKEUP">Reposição</option>
                  <option value="EXTRA">Extra</option>
                </select>
                <span className="mt-1.5 block text-xs text-[var(--inat-muted)]">
                  Participações regulares vêm da geração da lista; remanejamentos usam o fluxo próprio.
                </span>
              </label>
              <label>
                <span className="portal-label">Motivo</span>
                <textarea
                  name="assignmentReason"
                  maxLength={500}
                  rows={3}
                  className="portal-field mt-2 w-full px-3 py-2"
                  required
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="portal-button portal-button-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="portal-button portal-button-primary disabled:opacity-50"
              >
                {saving ? "Incluindo..." : "Incluir"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function AttendanceBoard({
  lesson,
  participants,
  attendance,
}: {
  lesson: Lesson;
  participants: LessonParticipant[];
  attendance: AttendanceRecord[];
}) {
  const router = useRouter();
  const locked = lesson.status === "CANCELLED";
  const attendanceMap = new Map(
    attendance.map((record) => [record.lessonParticipantId, record]),
  );
  const [rows, setRows] = useState<AttendanceDraft[]>(() =>
    participants.map((participant) => {
      const record = attendanceMap.get(participant.id);
      return {
        participant,
        recordId: record?.id,
        status: record?.status ?? "",
        checkInAt: localInputValue(record?.checkInAt ?? null),
        checkOutAt: localInputValue(record?.checkOutAt ?? null),
        notes: record?.notes ?? "",
      };
    }),
  );
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const visible = useMemo(
    () =>
      rows.filter((row) =>
        row.participant.learnerId
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [query, rows],
  );

  function patchRow(id: string, patch: Partial<AttendanceDraft>) {
    setRows((current) =>
      current.map((row) =>
        row.participant.id === id ? { ...row, ...patch } : row,
      ),
    );
  }

  function setStatus(id: string, status: AttendanceStatus) {
    const usesTime = ["PRESENT", "LATE", "PARTIAL"].includes(status);
    patchRow(id, {
      status,
      checkInAt: usesTime ? localInputValue(lesson.startsAt) : "",
      checkOutAt: usesTime ? localInputValue(lesson.endsAt) : "",
    });
  }

  function markMissingPresent() {
    setRows((current) =>
      current.map((row) =>
        row.status || row.participant.status === "CANCELLED"
          ? row
          : {
              ...row,
              status: "PRESENT",
              checkInAt: localInputValue(lesson.startsAt),
              checkOutAt: localInputValue(lesson.endsAt),
            },
      ),
    );
  }

  async function save() {
    if (locked) return;
    const changed = rows.filter(
      (row) => row.status && row.participant.status !== "CANCELLED",
    );
    const invalid = changed.find((row) => {
      const usesTime = ["PRESENT", "LATE", "PARTIAL"].includes(row.status);
      if (usesTime && !row.checkInAt) return true;
      return Boolean(
        row.checkInAt &&
          row.checkOutAt &&
          new Date(row.checkOutAt).getTime() < new Date(row.checkInAt).getTime(),
      );
    });
    if (invalid) {
      setError(
        "Revise os horários: presenças exigem entrada, e a saída não pode antecedê-la.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await Promise.all(
        changed.map((row) => {
          const body = {
            lessonParticipantId: row.participant.id,
            status: row.status,
            checkInAt: isoOrNull(row.checkInAt),
            checkOutAt: isoOrNull(row.checkOutAt),
            notes: row.notes.trim() || null,
          };
          return row.recordId
            ? putJson<AttendanceRecord>(
                `/api/backend/attendance-records/${encodeURIComponent(row.recordId)}`,
                body,
              )
            : postJson<AttendanceRecord>("/api/backend/attendance-records", body);
        }),
      );
      setMessage(`${changed.length} registro(s) de presença salvos no backend.`);
      router.refresh();
    } catch (requestError) {
      setError(
        requestErrorMessage(
          requestError,
          "Não foi possível salvar a chamada.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (!participants.length) {
    return (
      <Sheet>
        <EmptyState
          title="Lista de participantes vazia"
          description={
            locked
              ? "A aula foi cancelada e sua lista não pode mais ser alterada."
              : "Gere a lista regular ou inclua um participante antes de registrar presença."
          }
          icon="people"
        />
      </Sheet>
    );
  }

  return (
    <div className="grid gap-4">
      {locked ? (
        <RestrictionNotice>
          <strong className="block">Chamada bloqueada</strong>
          Presenças existentes permanecem visíveis, mas uma aula cancelada não aceita criação ou alteração de chamada.
        </RestrictionNotice>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ID do aprendiz"
            className="portal-field h-10 w-full pl-9 pr-3"
          />
        </div>
        {!locked ? (
          <button
            type="button"
            onClick={markMissingPresent}
            className="portal-button portal-button-secondary"
          >
            <Icon name="check" className="size-4" />
            Presentes nos sem registro
          </button>
        ) : null}
      </div>
      {error ? (
        <p
          role="alert"
          className="border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          {message}
        </p>
      ) : null}
      <div className="divide-y divide-[var(--inat-line)] border border-[var(--inat-line)] bg-white">
        {visible.map((row) => {
          const usesTime = ["PRESENT", "LATE", "PARTIAL"].includes(row.status);
          const rowLocked = locked || row.participant.status === "CANCELLED";
          return (
            <article key={row.participant.id} className="grid gap-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-semibold">
                    Aprendiz {row.participant.learnerId}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusMark>{apiLabel(row.participant.participationType)}</StatusMark>
                    {row.participant.status === "CANCELLED" ? (
                      <StatusMark>{apiLabel(row.participant.status)}</StatusMark>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {attendanceOptions.map((attendanceStatus) => (
                    <button
                      key={attendanceStatus}
                      type="button"
                      onClick={() => setStatus(row.participant.id, attendanceStatus)}
                      disabled={rowLocked}
                      className={`min-h-8 border px-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                        row.status === attendanceStatus
                          ? "border-[var(--inat-teal)] bg-[var(--inat-teal)] text-white"
                          : "border-[var(--inat-line)]"
                      }`}
                    >
                      {apiLabel(attendanceStatus)}
                    </button>
                  ))}
                </div>
              </div>
              {usesTime ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-[var(--inat-muted)]">
                    Entrada
                    <input
                      type="datetime-local"
                      value={row.checkInAt}
                      onChange={(event) =>
                        patchRow(row.participant.id, {
                          checkInAt: event.target.value,
                        })
                      }
                      disabled={rowLocked}
                      className="portal-field mt-1 h-9 w-full px-2 disabled:bg-[var(--inat-paper)]"
                    />
                  </label>
                  <label className="text-xs text-[var(--inat-muted)]">
                    Saída
                    <input
                      type="datetime-local"
                      value={row.checkOutAt}
                      onChange={(event) =>
                        patchRow(row.participant.id, {
                          checkOutAt: event.target.value,
                        })
                      }
                      disabled={rowLocked}
                      className="portal-field mt-1 h-9 w-full px-2 disabled:bg-[var(--inat-paper)]"
                    />
                  </label>
                </div>
              ) : null}
              <label className="text-xs text-[var(--inat-muted)]">
                Observação
                <input
                  value={row.notes}
                  onChange={(event) =>
                    patchRow(row.participant.id, { notes: event.target.value })
                  }
                  disabled={rowLocked}
                  maxLength={500}
                  className="portal-field mt-1 h-9 w-full px-2 disabled:bg-[var(--inat-paper)]"
                />
              </label>
            </article>
          );
        })}
      </div>
      {!locked ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={
              saving ||
              !rows.some(
                (row) => row.status && row.participant.status !== "CANCELLED",
              )
            }
            className="portal-button portal-button-clay disabled:opacity-50"
          >
            <Icon name="upload" className="size-4" />
            {saving ? "Salvando..." : "Salvar chamada"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LessonManager({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(lesson.deliveryMode);
  const [status, setStatus] = useState<LessonStatus>(lesson.status);

  function openEditor() {
    setDeliveryMode(lesson.deliveryMode);
    setStatus(lesson.status);
    setError("");
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startsAt = new Date(String(form.get("startsAt")));
    const endsAt = new Date(String(form.get("endsAt")));
    const room = String(form.get("room") ?? "").trim();
    const meetingUrl = String(form.get("meetingUrl") ?? "").trim();
    const externalLessonUrl = String(form.get("externalLessonUrl") ?? "").trim();

    if (
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime()) ||
      endsAt.getTime() <= startsAt.getTime()
    ) {
      setError("O término da aula deve ser posterior ao início.");
      return;
    }
    if (deliveryMode === "ONSITE" && !room) {
      setError("Aulas presenciais exigem uma sala.");
      return;
    }
    if (deliveryMode === "ONLINE" && !meetingUrl) {
      setError("Aulas online exigem um link de acesso.");
      return;
    }
    if (
      status === "CANCELLED" &&
      lesson.status !== "CANCELLED" &&
      !window.confirm(
        "Cancelar esta aula? Atividades abertas serão canceladas, lembretes pendentes expirarão e novas entregas serão bloqueadas.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      await putJson<Lesson>(
        `/api/backend/lessons/${encodeURIComponent(lesson.id)}`,
        {
          cohortId: lesson.cohortId,
          instructorPersonId: lesson.instructorPersonId,
          title: String(form.get("title") ?? "").trim(),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          deliveryMode,
          room: room || null,
          meetingUrl: meetingUrl || null,
          externalLessonUrl: externalLessonUrl || null,
          status,
        },
      );
      setOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(
        requestErrorMessage(requestError, "Não foi possível atualizar a aula."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Excluir a aula “${lesson.title}”?`)) return;
    setError("");
    try {
      await deleteResource(`/api/backend/lessons/${encodeURIComponent(lesson.id)}`);
      router.push("/sistema/aulas");
      router.refresh();
    } catch (requestError) {
      setError(
        requestErrorMessage(requestError, "Não foi possível excluir a aula."),
      );
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-[var(--inat-line)] bg-white p-3">
        <p className="text-xs text-[var(--inat-muted)]">
          Turma e instrutor permanecem fixos nesta edição.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openEditor}
            className="portal-button portal-button-secondary h-9"
          >
            <Icon name="edit" className="size-4" />
            Editar aula
          </button>
          <button
            type="button"
            onClick={remove}
            className="portal-button portal-button-quiet h-9 text-rose-700"
          >
            <Icon name="trash" className="size-4" />
            Excluir
          </button>
        </div>
        {error && !open ? (
          <p
            role="alert"
            className="w-full border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          >
            {error}
          </p>
        ) : null}
      </div>
      {open ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-edit-title"
        >
          <form
            onSubmit={submit}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[var(--inat-line)] bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 id="lesson-edit-title" className="text-lg font-semibold">
                Editar aula
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xl"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            {error ? (
              <p
                role="alert"
                className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
              >
                {error}
              </p>
            ) : null}
            {status === "CANCELLED" ? (
              <div className="mt-4">
                <RestrictionNotice>
                  <strong className="block">Efeito do cancelamento</strong>
                  Rascunhos e atividades publicadas serão cancelados na mesma operação. Lembretes pendentes e novas entregas serão bloqueados; atividades já encerradas permanecem no histórico.
                </RestrictionNotice>
              </div>
            ) : null}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="portal-label">Título</span>
                <input
                  name="title"
                  defaultValue={lesson.title}
                  maxLength={160}
                  className="portal-field mt-2 h-10 w-full px-3"
                  required
                />
              </label>
              <label>
                <span className="portal-label">Início</span>
                <input
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={localInputValue(lesson.startsAt)}
                  className="portal-field mt-2 h-10 w-full px-3"
                  required
                />
              </label>
              <label>
                <span className="portal-label">Término</span>
                <input
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={localInputValue(lesson.endsAt)}
                  className="portal-field mt-2 h-10 w-full px-3"
                  required
                />
              </label>
              <label>
                <span className="portal-label">Modalidade</span>
                <select
                  name="deliveryMode"
                  value={deliveryMode}
                  onChange={(event) =>
                    setDeliveryMode(event.target.value as DeliveryMode)
                  }
                  className="portal-field mt-2 h-10 w-full px-3"
                >
                  <option value="ONSITE">Presencial</option>
                  <option value="ONLINE">Online</option>
                </select>
              </label>
              <label>
                <span className="portal-label">Estado</span>
                <select
                  name="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as LessonStatus)
                  }
                  className="portal-field mt-2 h-10 w-full px-3"
                >
                  <option value="SCHEDULED">Agendada</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="COMPLETED">Concluída</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </label>
              <label>
                <span className="portal-label">
                  Sala {deliveryMode === "ONSITE" ? "(obrigatória)" : "(presencial)"}
                </span>
                <input
                  name="room"
                  defaultValue={lesson.room ?? ""}
                  maxLength={80}
                  required={deliveryMode === "ONSITE"}
                  disabled={deliveryMode !== "ONSITE"}
                  className="portal-field mt-2 h-10 w-full px-3 disabled:bg-[var(--inat-paper)]"
                />
              </label>
              <label>
                <span className="portal-label">
                  Link {deliveryMode === "ONLINE" ? "(obrigatório)" : "(online)"}
                </span>
                <input
                  name="meetingUrl"
                  type="url"
                  defaultValue={lesson.meetingUrl ?? ""}
                  maxLength={512}
                  required={deliveryMode === "ONLINE"}
                  disabled={deliveryMode !== "ONLINE"}
                  className="portal-field mt-2 h-10 w-full px-3 disabled:bg-[var(--inat-paper)]"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="portal-label">
                  URL da aula externa (opcional)
                </span>
                <input
                  name="externalLessonUrl"
                  type="url"
                  pattern="https?://.+"
                  title="Use uma URL iniciada por http:// ou https://"
                  defaultValue={lesson.externalLessonUrl ?? ""}
                  maxLength={2048}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="portal-field mt-2 h-10 w-full px-3"
                />
                <span className="mt-1.5 block text-xs text-[var(--inat-muted)]">
                  YouTube, Vimeo, Dailymotion, arquivo de vídeo ou outro player público.
                </span>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="portal-button portal-button-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="portal-button portal-button-primary disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

export function LessonWorkspace({
  lesson,
  activities,
  participants,
  attendance,
  learnerOptions,
  canManage,
}: {
  lesson: Lesson;
  activities: Activity[];
  participants: LessonParticipant[];
  attendance: AttendanceRecord[];
  learnerOptions: LearnerOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("resumo");
  const [rosterMessage, setRosterMessage] = useState("");
  const [rosterError, setRosterError] = useState("");
  const participantsMutable = !["CANCELLED", "COMPLETED"].includes(lesson.status);
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "resumo", label: "Resumo" },
    ...(canManage
      ? [
          {
            id: "participantes" as const,
            label: "Participantes",
            count: participants.length,
          },
          { id: "chamada" as const, label: "Chamada" },
        ]
      : []),
    { id: "atividades", label: "Atividades", count: activities.length },
    { id: "historico", label: "Histórico" },
  ];

  async function generateRoster() {
    if (!participantsMutable) return;
    setRosterError("");
    setRosterMessage("");
    try {
      const result = await postJson<{
        createdCount: number;
        existingCount: number;
      }>(
        `/api/backend/lesson-participants/lesson/${encodeURIComponent(lesson.id)}/generate-roster`,
      );
      setRosterMessage(
        `${result.createdCount} participante(s) incluídos; ${result.existingCount} já existiam.`,
      );
      router.refresh();
    } catch (requestError) {
      setRosterError(
        requestErrorMessage(
          requestError,
          "Não foi possível gerar a lista regular.",
        ),
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={`${formatDateTime(lesson.startsAt)} · ${formatTime(lesson.startsAt)}–${formatTime(lesson.endsAt)}`}
        title={lesson.title}
        description={`Turma ${lesson.cohortId} · Instrutor ${lesson.instructorPersonId}`}
        backHref="/sistema/aulas"
        backLabel="Voltar para aulas"
        action={<StatusMark>{apiLabel(lesson.status)}</StatusMark>}
      />
      {canManage ? <LessonManager lesson={lesson} /> : null}
      {lesson.status === "CANCELLED" ? (
        <div className="mb-4">
          <RestrictionNotice>
            <strong className="block">Aula cancelada</strong>
            Atividades que estavam em rascunho ou publicadas foram canceladas. Novas atividades, lembretes, entregas, alterações de participantes e registros de presença estão bloqueados.
          </RestrictionNotice>
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center gap-4 border-l-[3px] border-[var(--inat-teal)] bg-[var(--inat-mist)] px-4 py-3 text-xs">
        <span>{apiLabel(lesson.deliveryMode)}</span>
        <span>
          {lesson.deliveryMode === "ONLINE"
            ? lesson.meetingUrl || "Sem link"
            : lesson.room || "Sem sala"}
        </span>
      </div>
      <div className="mb-5 overflow-x-auto border-b border-[var(--inat-line)]">
        <div className="flex min-w-max" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`relative min-h-11 px-4 text-sm font-semibold ${
                tab === item.id
                  ? "text-[var(--inat-teal-dark)]"
                  : "text-[var(--inat-muted)]"
              }`}
            >
              {item.label}
              {item.count !== undefined ? (
                <span className="ml-1.5 font-mono text-xs">{item.count}</span>
              ) : null}
              {tab === item.id ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[var(--inat-clay)]" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {tab === "resumo" ? (
        <>
          <ExternalLessonPlayer
            url={lesson.externalLessonUrl}
            title={`Aula externa: ${lesson.title}`}
          />
          <div className="grid gap-5 xl:grid-cols-2">
            <Sheet>
              <SectionHeading title="Informações da aula" icon="book" />
              <DefinitionList
                columns={2}
                items={[
                  { label: "Início", value: formatDateTime(lesson.startsAt) },
                  { label: "Término", value: formatDateTime(lesson.endsAt) },
                  { label: "Modalidade", value: apiLabel(lesson.deliveryMode) },
                  {
                    label: "Local",
                    value:
                      lesson.deliveryMode === "ONLINE"
                        ? lesson.meetingUrl || "Sem link"
                        : lesson.room || "Sem sala",
                  },
                  { label: "Turma", value: lesson.cohortId, mono: true },
                  {
                    label: "Instrutor",
                    value: lesson.instructorPersonId,
                    mono: true,
                  },
                ]}
              />
            </Sheet>
            <Sheet>
              <SectionHeading title="Estado operacional" icon="activity" />
              <DefinitionList
                columns={1}
                items={[
                  {
                    label: "Participantes carregados",
                    value: String(participants.length),
                  },
                  {
                    label: "Presenças registradas",
                    value: String(attendance.length),
                  },
                  {
                    label: "Atividades vinculadas",
                    value: String(activities.length),
                  },
                ]}
              />
            </Sheet>
          </div>
        </>
      ) : null}

      {tab === "participantes" && canManage ? (
        <Sheet>
          <SectionHeading
            title="Lista esperada"
            icon="people"
            action={
              participantsMutable ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={generateRoster}
                    className="portal-button portal-button-secondary h-9"
                  >
                    Gerar lista regular
                  </button>
                  <ParticipantCreator
                    lessonId={lesson.id}
                    learnerOptions={learnerOptions}
                  />
                </div>
              ) : (
                <span className="text-xs font-normal text-[var(--inat-muted)]">
                  Lista somente para consulta
                </span>
              )
            }
          />
          {!participantsMutable ? (
            <div className="m-4">
              <RestrictionNotice>
                Participantes não podem ser alterados em aulas concluídas ou canceladas.
              </RestrictionNotice>
            </div>
          ) : null}
          {rosterError ? (
            <p
              role="alert"
              className="m-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            >
              {rosterError}
            </p>
          ) : null}
          {rosterMessage ? (
            <p
              role="status"
              className="m-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
            >
              {rosterMessage}
            </p>
          ) : null}
          {participants.length ? (
            <div className="divide-y divide-[var(--inat-line)]">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between gap-4 p-4 sm:px-5"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold">
                      Aprendiz {participant.learnerId}
                    </p>
                    <p className="mt-1 text-xs text-[var(--inat-muted)]">
                      {participant.assignmentReason ||
                        "Sem observação de atribuição"}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <StatusMark>{apiLabel(participant.participationType)}</StatusMark>
                    <StatusMark>{apiLabel(participant.status)}</StatusMark>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum participante"
              description={
                participantsMutable
                  ? "Gere a lista a partir das matrículas ou inclua uma participação."
                  : "A aula foi encerrada sem participantes registrados."
              }
              icon="people"
            />
          )}
        </Sheet>
      ) : null}

      {tab === "chamada" && canManage ? (
        <AttendanceBoard
          lesson={lesson}
          participants={participants}
          attendance={attendance}
        />
      ) : null}

      {tab === "atividades" ? (
        <Sheet>
          <SectionHeading title="Atividades da aula" icon="clipboard" />
          {lesson.status === "CANCELLED" && activities.length ? (
            <div className="m-4">
              <RestrictionNotice>
                Atividades abertas foram canceladas com a aula. As encerradas foram preservadas como histórico.
              </RestrictionNotice>
            </div>
          ) : null}
          {activities.length ? (
            <div className="divide-y divide-[var(--inat-line)]">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/sistema/atividades/${activity.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-[var(--inat-mist)]/35 sm:px-5"
                >
                  <div>
                    <p className="text-sm font-semibold">{activity.title}</p>
                    <p className="mt-1 text-xs text-[var(--inat-muted)]">
                      Prazo {formatDateTime(activity.dueAt)}
                    </p>
                  </div>
                  <StatusMark>{apiLabel(activity.status)}</StatusMark>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma atividade"
              description={
                lesson.status === "CANCELLED"
                  ? "Aulas canceladas não aceitam novas atividades."
                  : "Esta aula ainda não possui atividades no backend."
              }
              icon="clipboard"
            />
          )}
        </Sheet>
      ) : null}

      {tab === "historico" ? (
        <Sheet>
          <EmptyState
            title="Histórico indisponível"
            description="O backend atual não fornece eventos de auditoria desta aula."
            icon="clock"
          />
        </Sheet>
      ) : null}
    </>
  );
}
