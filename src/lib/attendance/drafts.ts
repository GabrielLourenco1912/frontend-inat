import type { AttendanceRecord, AttendanceStatus, LessonParticipant } from "@/lib/api/domain-contracts";
import { parseSaoPauloDateTimeInput, saoPauloDateTimeInputValue } from "@/lib/api/time-zone";

export type AttendanceFields = {
  status: AttendanceStatus | "";
  checkInAt: string;
  checkOutAt: string;
  notes: string;
};
export type AttendanceDraft = AttendanceFields & {
  participant: LessonParticipant;
  recordId?: string;
  baseline: AttendanceFields;
  acknowledged?: AttendanceRecord;
  saveState: "idle" | "saving" | "saved" | "error";
  error?: string;
};

export function localInputValue(value?: string | null) {
  return saoPauloDateTimeInputValue(value);
}

function fields(record?: AttendanceRecord): AttendanceFields {
  return { status: record?.status ?? "", checkInAt: localInputValue(record?.checkInAt),
    checkOutAt: localInputValue(record?.checkOutAt), notes: record?.notes ?? "" };
}
function signature(value: AttendanceFields) {
  return JSON.stringify([value.status, value.checkInAt, value.checkOutAt, value.notes.trim()]);
}
export function attendanceChanged(row: AttendanceDraft) {
  return signature(row) !== signature(row.baseline);
}

export function reconcileAttendance(current: AttendanceDraft[], participants: LessonParticipant[], attendance: AttendanceRecord[]): AttendanceDraft[] {
  const drafts = new Map(current.map((row) => [row.participant.id, row]));
  const records = new Map(attendance.map((record) => [record.lessonParticipantId, record]));
  return participants.map((participant) => {
    const previous = drafts.get(participant.id);
    let record = records.get(participant.id);
    // An RSC refresh started before a successful save may arrive after its response.
    // Keep the acknowledged ID and values until the read catches up.
    if (previous?.acknowledged && (!record || new Date(record.updatedAt).getTime() <= new Date(previous.acknowledged.updatedAt).getTime())) {
      record = previous.acknowledged;
    }
    const baseline = fields(record);
    if (previous && (attendanceChanged(previous) || previous.saveState === "saving" || previous.saveState === "error")) {
      const confirmed = previous.saveState !== "saving" && !!record && signature(previous) === signature(baseline);
      return { ...previous, participant, recordId: record?.id ?? previous.recordId, baseline,
        saveState: confirmed ? "saved" : previous.saveState, error: confirmed ? undefined : previous.error };
    }
    return { ...baseline, baseline, participant, recordId: record?.id,
      acknowledged: previous?.acknowledged, saveState: previous?.saveState === "saved" ? "saved" : "idle" };
  });
}

export function acknowledgeAttendance(row: AttendanceDraft, record: AttendanceRecord): AttendanceDraft {
  const baseline = fields(record);
  return { ...row, ...baseline, baseline, recordId: record.id, acknowledged: record, saveState: "saved", error: undefined };
}

export function attendanceValidation(row: AttendanceDraft) {
  if (!row.status) return "Selecione a situação da presença.";
  if (["PRESENT", "LATE", "PARTIAL"].includes(row.status) && !row.checkInAt) return "Informe o horário de entrada.";
  if ([row.checkInAt, row.checkOutAt].some((value) => value && Number.isNaN(parseSaoPauloDateTimeInput(value).getTime()))) return "Revise os horários informados.";
  if (row.checkInAt && row.checkOutAt && parseSaoPauloDateTimeInput(row.checkOutAt) < parseSaoPauloDateTimeInput(row.checkInAt)) return "A saída não pode anteceder a entrada.";
  return undefined;
}

export function attendanceBody(row: AttendanceDraft) {
  return { lessonParticipantId: row.participant.id, status: row.status,
    checkInAt: row.checkInAt ? parseSaoPauloDateTimeInput(row.checkInAt).toISOString() : null,
    checkOutAt: row.checkOutAt ? parseSaoPauloDateTimeInput(row.checkOutAt).toISOString() : null,
    notes: row.notes.trim() || null };
}

export async function saveAttendanceBatch(
  rows: AttendanceDraft[],
  send: (row: AttendanceDraft) => Promise<AttendanceRecord>,
  onResult: (row: AttendanceDraft, result: PromiseSettledResult<AttendanceRecord>) => void,
) {
  let saved = 0;
  let failed = 0;
  for (let offset = 0; offset < rows.length; offset += 5) {
    const results = await Promise.allSettled(rows.slice(offset, offset + 5).map(async (row) => {
      try {
        const validation = attendanceValidation(row);
        if (validation) throw new Error(validation);
        const record = await send(row);
        if (!record?.id) throw new Error("O serviço não confirmou o identificador da presença. Atualize a chamada antes de tentar novamente.");
        onResult(row, { status: "fulfilled", value: record });
        return record;
      } catch (reason) {
        onResult(row, { status: "rejected", reason });
        throw reason;
      }
    }));
    saved += results.filter((result) => result.status === "fulfilled").length;
    failed += results.filter((result) => result.status === "rejected").length;
  }
  return { saved, failed };
}
