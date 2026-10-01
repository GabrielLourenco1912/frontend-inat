"use client";

import { useState } from "react";
import { Icon } from "@/components/design-system/Icon";
import { downloadResource } from "@/lib/api/client";
import type { StoredFile } from "@/lib/api/domain-contracts";
import { formatFileSize } from "@/lib/api/format";

function fileNameFromDisposition(value: string | null, fallback: string) {
  if (!value) return fallback;
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return value.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

async function saveDownload(url: string, fallbackName: string) {
  const { blob, contentDisposition } = await downloadResource(url);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileNameFromDisposition(contentDisposition, fallbackName);
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function AttachmentFileList({
  files,
  url,
  onRemove,
}: {
  files: { file: StoredFile }[];
  url: (fileId: string) => string;
  onRemove?: (fileId: string) => void;
}) {
  const [error, setError] = useState("");
  if (!files.length) return <p className="p-4 text-sm text-[var(--inat-muted)]">Nenhum arquivo anexado.</p>;
  return (
    <div className="divide-y divide-[var(--inat-line)]">
      {error ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p> : null}
      {files.map(({ file }) => (
        <div key={file.id} className="flex items-center gap-3 p-4">
          <Icon name="paperclip" className="size-4 text-[var(--inat-teal-dark)]" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{file.originalName}</p><p className="mt-1 font-mono text-[0.625rem] text-[var(--inat-muted)]">{file.mimeType} · {formatFileSize(file.sizeBytes)}</p></div>
          <button type="button" onClick={() => saveDownload(url(file.id), file.originalName).catch(() => setError("Não foi possível baixar o arquivo."))} className="portal-button portal-button-quiet h-9"><Icon name="download" className="size-4" />Baixar</button>
          {onRemove ? <button type="button" onClick={() => onRemove(file.id)} className="portal-button portal-button-quiet h-9 text-rose-700" aria-label={`Remover ${file.originalName}`}><Icon name="trash" className="size-4" /></button> : null}
        </div>
      ))}
    </div>
  );
}
