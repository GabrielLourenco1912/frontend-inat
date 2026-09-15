"use client";

import { useState } from "react";
import { Icon } from "@/components/design-system/Icon";
import { XLSX_DOWNLOAD_TYPE } from "@/lib/attendance/download";
import type { AttendanceExportScope } from "@/lib/attendance/export-permissions";

export function AttendanceExportButton({ scope, id }: { scope: AttendanceExportScope; id: string }) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setExporting(true); setError("");
    try {
      const response = await fetch(`/api/exports/attendance/${scope}/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Não foi possível exportar as presenças. Tente novamente.");
      }
      if (!response.headers.get("content-type")?.includes(XLSX_DOWNLOAD_TYPE)) throw new Error("Não foi possível obter a planilha. Atualize a página e tente novamente.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `presencas-${scope === "organizations" ? "organizacao" : "aprendiz"}-${id}.xlsx`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível exportar as presenças.");
    } finally { setExporting(false); }
  }
  return <div className="flex max-w-sm flex-col items-start gap-2">
    <button type="button" onClick={download} disabled={exporting} aria-busy={exporting} className="portal-button portal-button-secondary h-9 disabled:opacity-60"><Icon name="download" className="size-4" />{exporting ? "Exportando..." : "Exportar presenças (Excel)"}</button>
    {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : null}
  </div>;
}
