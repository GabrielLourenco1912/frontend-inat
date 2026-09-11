"use client";

import { ListPagination } from "@/components/design-system/ListPagination";
import { useClientPagination } from "@/components/design-system/ClientPagination";
import type { Pagination } from "@/lib/pagination";
import type { ReactNode } from "react";
import { Icon } from "@/components/design-system/Icon";
import { EmptyState } from "@/components/design-system/PortalPrimitives";
import type { StoredFile } from "@/lib/api/domain-contracts";
import { formatFileSize } from "@/lib/api/format";

export function DocumentWorkspace({ items, selectedId, onSelect, children, emptyTitle, emptyDescription, pagination }: {
  items: { id: string; title: string; subtitle: string; detail: string; status: ReactNode }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  children: ReactNode;
  pagination?: Pagination;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const local = useClientPagination(items, "", items.findIndex((item) => item.id === selectedId));
  const visible = pagination ? items : local.items;
  const controls = pagination ? <ListPagination shown={items.length} {...pagination} /> : local.controls;
  if (!items.length) return <><EmptyState title={emptyTitle} description={emptyDescription} icon="document" />{controls}{children}</>;
  return (
    <div className="lg:grid lg:min-h-[32rem] lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)]">
      <div className="border-b border-[var(--inat-line)] lg:border-b-0 lg:border-r">
        <ul aria-label="Documentos disponíveis" className="divide-y divide-[var(--inat-line)]">
          {visible.map((item) => (
            <li key={item.id}>
              <button type="button" aria-pressed={selectedId === item.id} onClick={() => onSelect(item.id)} className={`w-full border-l-[3px] p-4 text-left sm:p-5 ${selectedId === item.id ? "border-l-[var(--inat-clay)] bg-[var(--inat-mist)]" : "border-l-transparent hover:bg-[var(--inat-paper)]"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="break-words text-sm font-semibold">{item.title}</p>
                  {item.status}
                </div>
                <p className="mt-2 break-all text-xs text-[var(--inat-muted)]">{item.subtitle}</p>
                <p className="mt-3 text-xs text-[var(--inat-muted)]">{item.detail}</p>
              </button>
            </li>
          ))}
        </ul>
        {controls}
      </div>
      <section aria-label="Detalhes do documento" className="min-w-0">{children}</section>
    </div>
  );
}

export function DocumentFileCard({ file, onDownload, downloading = false }: {
  file: StoredFile;
  onDownload: () => void;
  downloading?: boolean;
}) {
  return (
    <div className="grid min-h-56 place-items-center border border-[var(--inat-line)] bg-[var(--inat-paper)] p-5 text-center">
      <div className="min-w-0">
        <span className="mx-auto grid size-14 place-items-center bg-white text-[var(--inat-teal-dark)] shadow-sm"><Icon name="document" className="size-7" /></span>
        <p className="mt-4 break-all text-sm font-semibold">{file.originalName}</p>
        <p className="mt-2 break-all text-xs text-[var(--inat-muted)]">{file.mimeType} · {formatFileSize(file.sizeBytes)}</p>
        <button type="button" onClick={onDownload} disabled={downloading} className="portal-button portal-button-secondary mt-4 h-9 disabled:opacity-50">
          <Icon name="download" className="size-4" />{downloading ? "Baixando..." : "Baixar arquivo"}
        </button>
      </div>
    </div>
  );
}
