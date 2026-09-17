import "server-only";

import ExcelJS from "exceljs";
import type { AttendanceStatus } from "@/lib/api/domain-contracts";
import type { AttendanceExport, AttendanceExportRow } from "@/lib/attendance/export-data";
import { apiLabel, formatDate, formatDateTime, formatTime, maskTaxId } from "@/lib/api/format";

export { XLSX_DOWNLOAD_TYPE as XLSX_CONTENT_TYPE } from "@/lib/attendance/download";

const FONT = "Aptos";
const INK = "FF203436";
const TEAL = "FF088285";
const TEAL_DARK = "FF066C6F";
const CLAY = "FFD16B36";
const MIST = "FFEAF3F1";
const PAPER = "FFF8FAF9";
const LINE = "FFDBE7E4";
const MUTED = "FF6E7574";
const WHITE = "FFFFFFFF";

const attendanceStatuses: AttendanceStatus[] = ["PRESENT", "ABSENT", "EXCUSED", "LATE", "PARTIAL"];

function minutesBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const milliseconds = new Date(end).getTime() - new Date(start).getTime();
  return Number.isFinite(milliseconds) && milliseconds >= 0 ? Math.round(milliseconds / 60_000) : null;
}

function localDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeZone: "America/Sao_Paulo",
  }).format(date);
}

function weekday(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const result = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" }).format(date);
  return result.replace(".", "").replace(/^./, (letter) => letter.toUpperCase());
}

function periodValue(value: string | undefined, fallback: string) {
  return value ? formatDate(value) : fallback;
}

function durationText(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}min`;
}

function durationCell(minutes: number | null) {
  return minutes === null ? "" : minutes / 1_440;
}

function learnerName(row: AttendanceExportRow) {
  return row.learnerPerson?.fullName || "Nome restrito ao perfil";
}

function groupRows(rows: AttendanceExportRow[]) {
  const groups = new Map<string, AttendanceExportRow[]>();
  for (const row of rows) {
    const group = groups.get(row.learner.id) ?? [];
    group.push(row);
    groups.set(row.learner.id, group);
  }
  return [...groups.values()];
}

function applyBaseStyle(sheet: ExcelJS.Worksheet) {
  sheet.eachRow((row) => row.eachCell({ includeEmpty: true }, (cell) => {
    if (!cell.font?.name) cell.font = { name: FONT, size: 10, color: { argb: INK } };
    if (!cell.alignment) cell.alignment = { vertical: "middle" };
  }));
  sheet.properties.defaultRowHeight = 20;
  sheet.pageSetup = {
    orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    margins: { left: 0.25, right: 0.25, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 },
  };
  sheet.headerFooter.oddFooter = "&LINAT · Espelho de ponto&C&P de &N&RConfidencial";
}

function styleSummary(summary: ExcelJS.Worksheet) {
  applyBaseStyle(summary);
  summary.getRow(1).height = 38;
  summary.getRow(1).font = { name: FONT, size: 20, bold: true, color: { argb: WHITE } };
  summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
  summary.getRow(2).font = { name: FONT, size: 13, bold: true, color: { argb: TEAL_DARK } };
  for (let rowNumber = 3; rowNumber <= 15; rowNumber += 1) {
    summary.getCell(rowNumber, 1).font = { name: FONT, size: 10, bold: true, color: { argb: MUTED } };
    summary.getCell(rowNumber, 2).alignment = { vertical: "top", wrapText: true };
  }
  summary.getRow(16).font = { name: FONT, size: 10, bold: true, color: { argb: WHITE } };
  summary.getRow(16).fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
  for (let rowNumber = 17; rowNumber < 17 + attendanceStatuses.length; rowNumber += 1) {
    if (rowNumber % 2 === 1) summary.getRow(rowNumber).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PAPER } };
  }
}

function addPointHeader(sheet: ExcelJS.Worksheet, report: AttendanceExport, scheduledMinutes: number, attendedMinutes: number) {
  sheet.mergeCells("A1:N1");
  sheet.getCell("A1").value = "ESPELHO DE PONTO · APRENDIZAGEM";
  sheet.getCell("A1").font = { name: FONT, size: 20, bold: true, color: { argb: WHITE } };
  sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
  sheet.getRow(1).height = 40;
  sheet.mergeCells("A2:N2");
  sheet.getCell("A2").value = report.scope === "organizations" ? `Organização · ${report.title}` : `Aprendiz · ${report.title}`;
  sheet.getCell("A2").font = { name: FONT, size: 13, bold: true, color: { argb: TEAL_DARK } };
  sheet.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: MIST } };
  sheet.getRow(2).height = 28;
  sheet.mergeCells("A3:N3");
  sheet.getCell("A3").value = `Período: ${periodValue(report.period.startDate, "primeiro registro")} a ${periodValue(report.period.endDate, "último registro")} · Gerado em ${formatDateTime(new Date().toISOString())}`;
  sheet.getCell("A3").font = { name: FONT, size: 9, color: { argb: MUTED } };

  const metrics: Array<[string, string | number]> = [
    ["Aprendizes", report.learnerCount], ["Registros", report.rows.length],
    ["Carga prevista", durationText(scheduledMinutes)], ["Carga registrada", durationText(attendedMinutes)],
  ];
  metrics.forEach(([label, value], index) => {
    const start = 1 + index * 3;
    sheet.mergeCells(5, start, 5, start + 1);
    sheet.mergeCells(6, start, 6, start + 1);
    const labelCell = sheet.getCell(5, start);
    labelCell.value = label;
    labelCell.font = { name: FONT, size: 9, bold: true, color: { argb: MUTED } };
    const valueCell = sheet.getCell(6, start);
    valueCell.value = value;
    valueCell.font = { name: FONT, size: 15, bold: true, color: { argb: index === 3 ? CLAY : INK } };
  });
  sheet.getRow(6).height = 25;
}

const pointColumns = [
  { key: "date", width: 13 }, { key: "weekday", width: 12 }, { key: "lesson", width: 34 },
  { key: "cohort", width: 20 }, { key: "mode", width: 14 }, { key: "scheduled", width: 18 },
  { key: "checkIn", width: 12 }, { key: "checkOut", width: 12 }, { key: "scheduledDuration", width: 17 },
  { key: "attendedDuration", width: 18 }, { key: "status", width: 17 }, { key: "instructor", width: 27 },
  { key: "recorded", width: 21 }, { key: "notes", width: 38 },
];

const pointHeaders = ["Data", "Dia", "Aula", "Turma", "Modalidade", "Horário previsto", "Entrada", "Saída", "Carga prevista", "Carga registrada", "Situação", "Instrutor", "Registrado em", "Observações"];

function statusColor(status: AttendanceStatus) {
  if (status === "PRESENT") return "FFDCF2E8";
  if (status === "ABSENT") return "FFFBE0E0";
  if (status === "EXCUSED") return "FFFFF0D5";
  return "FFE6EDF7";
}

function addLearnerBlock(sheet: ExcelJS.Worksheet, rows: AttendanceExportRow[]) {
  const first = rows[0];
  const name = learnerName(first);
  const scheduledMinutes = rows.reduce((total, row) => total + (minutesBetween(row.lesson.startsAt, row.lesson.endsAt) ?? 0), 0);
  const durations = rows.map((row) => minutesBetween(row.record.checkInAt, row.record.checkOutAt));
  const attendedMinutes = durations.reduce<number>((total, value) => total + (value ?? 0), 0);
  const missingMarks = durations.filter((value) => value === null).length;

  const learnerRow = sheet.addRow([]);
  sheet.mergeCells(learnerRow.number, 1, learnerRow.number, 14);
  learnerRow.getCell(1).value = `APRENDIZ · ${name}`;
  learnerRow.getCell(1).font = { name: FONT, size: 12, bold: true, color: { argb: WHITE } };
  learnerRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_DARK } };
  learnerRow.height = 28;

  const meta = sheet.addRow([
    "Matrícula", first.learner.registrationNumber, "", "CPF", first.learnerPerson ? maskTaxId(first.learnerPerson.taxId) : "Restrito", "",
    "Registros", rows.length, "Carga prevista", durationText(scheduledMinutes), "Carga registrada", durationText(attendedMinutes), "Sem marcação completa", missingMarks,
  ]);
  for (const column of [1, 4, 7, 9, 11, 13]) meta.getCell(column).font = { name: FONT, size: 9, bold: true, color: { argb: MUTED } };
  meta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MIST } };
  meta.height = 24;

  const header = sheet.addRow(pointHeaders);
  header.height = 31;
  header.eachCell((cell) => {
    cell.font = { name: FONT, size: 9, bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: TEAL_DARK } } };
  });

  rows.forEach((row, index) => {
    const scheduled = minutesBetween(row.lesson.startsAt, row.lesson.endsAt);
    const attended = minutesBetween(row.record.checkInAt, row.record.checkOutAt);
    const detail = sheet.addRow([
      localDate(row.lesson.startsAt), weekday(row.lesson.startsAt), row.lesson.title,
      `${row.cohort.code} · ${row.cohort.name}`, apiLabel(row.lesson.deliveryMode),
      `${formatTime(row.lesson.startsAt)} – ${formatTime(row.lesson.endsAt)}`,
      row.record.checkInAt ? formatTime(row.record.checkInAt) : "—",
      row.record.checkOutAt ? formatTime(row.record.checkOutAt) : "—",
      durationCell(scheduled), durationCell(attended), apiLabel(row.record.status),
      row.instructorName, formatDateTime(row.record.recordedAt), row.record.notes ?? "",
    ]);
    detail.height = 27;
    if (index % 2 === 1) detail.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PAPER } };
    detail.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = { bottom: { style: "hair", color: { argb: LINE } } };
    });
    detail.getCell(9).numFmt = "[h]:mm";
    detail.getCell(10).numFmt = "[h]:mm";
    detail.getCell(11).fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusColor(row.record.status) } };
    detail.getCell(11).font = { name: FONT, size: 9, bold: true, color: { argb: INK } };
  });

  const total = sheet.addRow([]);
  sheet.mergeCells(total.number, 1, total.number, 8);
  total.getCell(1).value = `TOTAL · ${name}`;
  total.getCell(9).value = durationCell(scheduledMinutes);
  total.getCell(10).value = durationCell(attendedMinutes);
  total.getCell(9).numFmt = "[h]:mm";
  total.getCell(10).numFmt = "[h]:mm";
  sheet.mergeCells(total.number, 11, total.number, 14);
  total.getCell(11).value = `${rows.length} registro(s) · ${missingMarks} sem entrada e saída completas`;
  total.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: FONT, size: 9, bold: true, color: { argb: INK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MIST } };
    cell.border = { top: { style: "medium", color: { argb: TEAL } } };
  });
  total.height = 24;
  sheet.addRow([]).height = 12;
}

export async function attendanceWorkbook(report: AttendanceExport) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "INAT";
  workbook.company = "INAT Paranaguá";
  workbook.subject = "Espelho de ponto dos aprendizes";
  workbook.created = new Date();

  const scheduledMinutes = report.rows.reduce((total, row) => total + (minutesBetween(row.lesson.startsAt, row.lesson.endsAt) ?? 0), 0);
  const attendedMinutes = report.rows.reduce((total, row) => total + (minutesBetween(row.record.checkInAt, row.record.checkOutAt) ?? 0), 0);
  const statusCounts = new Map<AttendanceStatus, number>(attendanceStatuses.map((status) => [status, 0]));
  for (const row of report.rows) statusCounts.set(row.record.status, (statusCounts.get(row.record.status) ?? 0) + 1);

  const summary = workbook.addWorksheet("Resumo", { views: [{ state: "frozen", ySplit: 2 }] });
  summary.columns = [{ width: 34 }, { width: 92 }];
  summary.addRows([
    ["RELATÓRIO DE PONTO", "INAT Paranaguá"],
    [report.scope === "organizations" ? "Organização" : "Aprendiz", report.title],
    ["Data inicial", periodValue(report.period.startDate, "Sem limite inicial")],
    ["Data final", periodValue(report.period.endDate, "Sem limite final")],
    ["Gerado em", formatDateTime(workbook.created.toISOString())],
    ["Fuso horário", "America/Sao_Paulo"],
    ["Filtro de contratos", report.activeContractsOnly ? "Somente contratos ativos da organização" : "Não aplicado; o aprendiz foi selecionado diretamente"],
    ["Aprendizes com registros", report.learnerCount],
    ["Aulas com registros", report.lessonCount],
    ["Registros de presença", report.rows.length],
    ["Abrangência", report.restricted ? "Somente aulas ministradas pelo instrutor atual." : "Registros filtrados no backend antes da paginação."],
    ["Conteúdo", "Uma linha por aula registrada. A carga registrada exige entrada e saída válidas; horários ausentes não são estimados."],
    ["Carga horária prevista", durationText(scheduledMinutes)],
    ["Carga horária registrada", durationText(attendedMinutes)],
    ["Registros sem marcação completa", report.rows.filter((row) => minutesBetween(row.record.checkInAt, row.record.checkOutAt) === null).length],
    ["Distribuição por situação", "Quantidade"],
    ...attendanceStatuses.map((status) => [apiLabel(status), statusCounts.get(status) ?? 0]),
  ]);
  styleSummary(summary);

  const sheet = workbook.addWorksheet("Espelho de ponto", { views: [{ state: "frozen", ySplit: 6 }] });
  sheet.columns = pointColumns;
  addPointHeader(sheet, report, scheduledMinutes, attendedMinutes);
  const groups = groupRows(report.rows);
  if (groups.length) {
    sheet.addRow([]).height = 12;
    for (const rows of groups) addLearnerBlock(sheet, rows);
  } else {
    sheet.mergeCells("A8:N10");
    sheet.getCell("A8").value = "Nenhum registro de presença foi encontrado para o período selecionado.";
    sheet.getCell("A8").alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    sheet.getCell("A8").font = { name: FONT, size: 11, italic: true, color: { argb: MUTED } };
    sheet.getCell("A8").fill = { type: "pattern", pattern: "solid", fgColor: { argb: PAPER } };
  }
  applyBaseStyle(sheet);
  sheet.getColumn(9).alignment = { horizontal: "right", vertical: "middle" };
  sheet.getColumn(10).alignment = { horizontal: "right", vertical: "middle" };
  sheet.getColumn(14).alignment = { wrapText: true, vertical: "top" };
  sheet.pageSetup.printArea = `A1:N${sheet.rowCount}`;

  return workbook.xlsx.writeBuffer();
}
