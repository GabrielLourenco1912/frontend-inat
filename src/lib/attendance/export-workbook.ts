import "server-only";

import ExcelJS from "exceljs";
import type { AttendanceStatus } from "@/lib/api/domain-contracts";
import type { AttendanceExport } from "@/lib/attendance/export-data";
import {
  apiLabel,
  formatDate,
  formatDateTime,
  formatTime,
  maskTaxId,
} from "@/lib/api/format";

export { XLSX_DOWNLOAD_TYPE as XLSX_CONTENT_TYPE } from "@/lib/attendance/download";

const attendanceStatuses: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "EXCUSED",
  "LATE",
  "PARTIAL",
];

function minutesBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const milliseconds = new Date(end).getTime() - new Date(start).getTime();
  return Number.isFinite(milliseconds) && milliseconds >= 0
    ? Math.round(milliseconds / 60_000)
    : null;
}

function lessonDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(date);
}

function periodValue(value: string | undefined, fallback: string) {
  return value ? formatDate(value) : fallback;
}

export async function attendanceWorkbook(report: AttendanceExport) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "INAT";
  workbook.created = new Date();

  const statusCounts = new Map<AttendanceStatus, number>();
  for (const status of attendanceStatuses) statusCounts.set(status, 0);
  for (const row of report.rows) {
    statusCounts.set(row.record.status, (statusCounts.get(row.record.status) ?? 0) + 1);
  }

  const summary = workbook.addWorksheet("Resumo");
  summary.columns = [{ width: 32 }, { width: 100 }];
  summary.addRows([
    ["Relatório", "Presenças dos aprendizes"],
    [report.scope === "organizations" ? "Organização" : "Aprendiz", report.title],
    ["Data inicial", periodValue(report.period.startDate, "Sem limite inicial")],
    ["Data final", periodValue(report.period.endDate, "Sem limite final")],
    ["Gerado em", formatDateTime(workbook.created.toISOString())],
    ["Fuso horário", "America/Sao_Paulo"],
    ["Filtro de contratos", report.activeContractsOnly
      ? "Somente contratos ativos da organização"
      : "Não aplicado; o aprendiz foi selecionado diretamente"],
    ["Aprendizes com registros", report.learnerCount],
    ["Aulas com registros", report.lessonCount],
    ["Registros de presença", report.rows.length],
    ["Abrangência", report.restricted
      ? "Somente aulas ministradas pelo instrutor atual."
      : "Registros filtrados no backend antes da paginação."],
    ["Conteúdo", "Somente chamadas registradas; aulas sem lançamento não são inferidas pelo relatório."],
    [],
    ["Distribuição por situação", "Quantidade"],
    ...attendanceStatuses.map((status) => [apiLabel(status), statusCounts.get(status) ?? 0]),
  ]);
  summary.getColumn(1).font = { bold: true };
  summary.getColumn(2).alignment = { vertical: "top", wrapText: true };
  summary.getRow(14).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summary.getRow(14).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF176B65" },
  };
  summary.getRow(7).height = 32;
  summary.getRow(11).height = 32;
  summary.getRow(12).height = 32;

  const sheet = workbook.addWorksheet("Presenças", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Matrícula", key: "registration", width: 22 },
    { header: "Aprendiz", key: "name", width: 34 },
    { header: "CPF", key: "taxId", width: 18 },
    { header: "Código da turma", key: "cohortCode", width: 20 },
    { header: "Turma", key: "cohort", width: 30 },
    { header: "Aula", key: "lesson", width: 42 },
    { header: "Data da aula", key: "lessonDate", width: 16 },
    { header: "Início previsto", key: "starts", width: 18 },
    { header: "Fim previsto", key: "ends", width: 18 },
    { header: "Carga horária (min)", key: "scheduledMinutes", width: 22 },
    { header: "Modalidade", key: "mode", width: 16 },
    { header: "Local", key: "location", width: 24 },
    { header: "Instrutor", key: "instructor", width: 34 },
    { header: "Situação da aula", key: "lessonStatus", width: 20 },
    { header: "Situação da presença", key: "status", width: 23 },
    { header: "Entrada", key: "checkIn", width: 18 },
    { header: "Saída", key: "checkOut", width: 18 },
    { header: "Permanência (min)", key: "attendedMinutes", width: 20 },
    { header: "Cobertura da aula (%)", key: "coverage", width: 23 },
    { header: "Registrada em", key: "recorded", width: 21 },
    { header: "Atualizada em", key: "updated", width: 21 },
    { header: "Observações", key: "notes", width: 60 },
  ];

  for (const {
    record,
    lesson,
    cohort,
    learner,
    learnerPerson,
    instructorName,
  } of report.rows) {
    const scheduledMinutes = minutesBetween(lesson.startsAt, lesson.endsAt);
    const attendedMinutes = minutesBetween(record.checkInAt, record.checkOutAt);
    const coverage = scheduledMinutes && attendedMinutes !== null
      ? Number(((attendedMinutes / scheduledMinutes) * 100).toFixed(1))
      : "";
    sheet.addRow({
      registration: learner.registrationNumber,
      name: learnerPerson?.fullName || "Nome restrito ao perfil",
      taxId: learnerPerson ? maskTaxId(learnerPerson.taxId) : "",
      cohortCode: cohort.code,
      cohort: cohort.name,
      lesson: lesson.title,
      lessonDate: lessonDate(lesson.startsAt),
      starts: formatTime(lesson.startsAt),
      ends: formatTime(lesson.endsAt),
      scheduledMinutes: scheduledMinutes ?? "",
      mode: apiLabel(lesson.deliveryMode),
      location: lesson.deliveryMode === "ONLINE" ? "Online" : lesson.room || "Não informado",
      instructor: instructorName,
      lessonStatus: apiLabel(lesson.status),
      status: apiLabel(record.status),
      checkIn: record.checkInAt ? formatTime(record.checkInAt) : "",
      checkOut: record.checkOutAt ? formatTime(record.checkOutAt) : "",
      attendedMinutes: attendedMinutes ?? "",
      coverage,
      recorded: formatDateTime(record.recordedAt),
      updated: formatDateTime(record.updatedAt),
      notes: record.notes ?? "",
    });
  }

  sheet.autoFilter = "A1:V1";
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF176B65" },
  };
  sheet.getRow(1).height = 30;
  sheet.getRow(1).alignment = { vertical: "middle", wrapText: true };
  sheet.getColumn("notes").alignment = { wrapText: true, vertical: "top" };
  sheet.getColumn("coverage").numFmt = "0.0";
  return workbook.xlsx.writeBuffer();
}
