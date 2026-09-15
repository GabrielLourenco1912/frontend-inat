import "server-only";

import ExcelJS from "exceljs";
import type { AttendanceExport } from "@/lib/attendance/export-data";
import { apiLabel, formatDateTime } from "@/lib/api/format";

export { XLSX_DOWNLOAD_TYPE as XLSX_CONTENT_TYPE } from "@/lib/attendance/download";

export async function attendanceWorkbook(report: AttendanceExport) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "INAT";
  workbook.created = new Date();
  const summary = workbook.addWorksheet("Resumo");
  summary.columns = [{ width: 28 }, { width: 100 }];
  summary.addRows([
    ["Relatório", "Presenças dos aprendizes"],
    [report.scope === "organizations" ? "Organização" : "Aprendiz", report.title],
    ["Gerado em", formatDateTime(workbook.created.toISOString())],
    ["Fuso horário", "America/Sao_Paulo"],
    ["Aprendizes vinculados", report.learnerCount],
    ["Registros de presença", report.rows.length],
    ["Abrangência", report.restricted ? "Histórico das aulas ministradas pelo instrutor atual." : report.scope === "organizations" ? "Histórico completo dos aprendizes vinculados por contratos à organização, incluindo vínculos anteriores." : "Histórico completo do aprendiz."],
    ["Conteúdo", "Somente presenças registradas; aulas sem lançamento não são contabilizadas como faltas."],
  ]);
  summary.getColumn(1).font = { bold: true };
  summary.getColumn(2).alignment = { vertical: "top", wrapText: true };
  summary.getRow(7).height = 32;
  summary.getRow(8).height = 32;

  const sheet = workbook.addWorksheet("Presenças", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Matrícula", key: "registration", width: 24 },
    { header: "Aprendiz", key: "name", width: 35 },
    { header: "Aula", key: "lesson", width: 44 },
    { header: "Início da aula", key: "starts", width: 23 },
    { header: "Fim da aula", key: "ends", width: 23 },
    { header: "Modalidade", key: "mode", width: 18 },
    { header: "Presença", key: "status", width: 18 },
    { header: "Entrada", key: "checkIn", width: 23 },
    { header: "Saída", key: "checkOut", width: 23 },
    { header: "Registrada em", key: "recorded", width: 23 },
    { header: "Observações", key: "notes", width: 60 },
  ];
  for (const { record, lesson, learner, learnerName } of report.rows) {
    // Plain string cells preserve leading zeros and never interpret user text as formulas.
    sheet.addRow({ registration: learner.registrationNumber, name: learnerName || "Nome restrito ao perfil",
      lesson: lesson.title, starts: formatDateTime(lesson.startsAt), ends: formatDateTime(lesson.endsAt),
      mode: apiLabel(lesson.deliveryMode), status: apiLabel(record.status),
      checkIn: record.checkInAt ? formatDateTime(record.checkInAt) : "",
      checkOut: record.checkOutAt ? formatDateTime(record.checkOutAt) : "",
      recorded: formatDateTime(record.recordedAt), notes: record.notes ?? "" });
  }
  sheet.autoFilter = "A1:K1";
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF176B65" } };
  sheet.getRow(1).height = 24;
  sheet.getColumn("notes").alignment = { wrapText: true, vertical: "top" };
  return workbook.xlsx.writeBuffer();
}
