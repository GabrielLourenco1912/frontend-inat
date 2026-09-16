"use client";

import { FormEvent, useId, useState } from "react";
import { Icon } from "@/components/design-system/Icon";
import { XLSX_DOWNLOAD_TYPE } from "@/lib/attendance/download";
import type { AttendanceExportScope } from "@/lib/attendance/export-permissions";

export function AttendanceExportButton({
  scope,
  id,
}: {
  scope: AttendanceExportScope;
  id: string;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function close() {
    if (exporting) return;
    setOpen(false);
    setError("");
  }

  async function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startDate && endDate && endDate < startDate) {
      setError("A data final não pode ser anterior à data inicial.");
      return;
    }
    setExporting(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (startDate) query.set("startDate", startDate);
      if (endDate) query.set("endDate", endDate);
      const suffix = query.size ? `?${query}` : "";
      const response = await fetch(
        `/api/exports/attendance/${scope}/${encodeURIComponent(id)}${suffix}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.message || "Não foi possível exportar as presenças. Tente novamente.",
        );
      }
      if (!response.headers.get("content-type")?.includes(XLSX_DOWNLOAD_TYPE)) {
        throw new Error(
          "Não foi possível obter a planilha. Atualize a página e tente novamente.",
        );
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `presencas-${scope === "organizations" ? "organizacao" : "aprendiz"}-${id}.xlsx`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível exportar as presenças.",
      );
    } finally {
      setExporting(false);
    }
  }

  return <>
    <button
      type="button"
      onClick={() => { setError(""); setOpen(true); }}
      className="portal-button portal-button-secondary h-9"
    >
      <Icon name="download" className="size-4" />
      Exportar presenças (Excel)
    </button>
    {open ? <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <form
        onSubmit={download}
        className="w-full max-w-lg border border-[var(--inat-line)] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--inat-line)] px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-teal)]">Relatório Excel</p>
            <h2 id={titleId} className="mt-1 text-lg font-semibold">Exportar presenças</h2>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={exporting}
            className="grid size-9 place-items-center text-xl disabled:opacity-50"
            aria-label="Fechar"
          >×</button>
        </div>
        <div className="grid gap-5 p-5">
          <p className="border-l-[3px] border-[var(--inat-teal)] bg-[var(--inat-mist)] p-3 text-sm leading-6">
            {scope === "organizations"
              ? "O relatório considera somente aprendizes com contrato ativo nesta organização."
              : "O relatório considera este aprendiz, independentemente da situação atual dos contratos."}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="portal-label">Data inicial (opcional)</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                className="portal-field mt-2 h-10 w-full px-3"
                autoFocus
              />
            </label>
            <label>
              <span className="portal-label">Data final (opcional)</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                className="portal-field mt-2 h-10 w-full px-3"
              />
            </label>
          </div>
          <p className="text-xs leading-5 text-[var(--inat-muted)]">
            As datas são inclusivas e correspondem à data de início da aula no fuso de São Paulo. Deixe os dois campos vazios para exportar todo o período disponível.
          </p>
          {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--inat-line)] px-5 py-4">
          <button
            type="button"
            onClick={close}
            disabled={exporting}
            className="portal-button portal-button-secondary disabled:opacity-50"
          >Cancelar</button>
          <button
            type="submit"
            disabled={exporting}
            aria-busy={exporting}
            className="portal-button portal-button-primary disabled:opacity-60"
          >
            <Icon name="download" className="size-4" />
            {exporting ? "Gerando planilha..." : "Gerar planilha"}
          </button>
        </div>
      </form>
    </div> : null}
  </>;
}
