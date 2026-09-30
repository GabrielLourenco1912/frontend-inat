"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useClientPagination } from "@/components/design-system/ClientPagination";
import { Icon, type IconName } from "@/components/design-system/Icon";
import { EmptyState } from "@/components/design-system/PortalPrimitives";
import { apiLabel } from "@/lib/api/format";
import { filterDetailItems } from "@/lib/detail-filter";

type Props<T> = {
  items: T[];
  itemLabel: string;
  itemPlural: string;
  searchPlaceholder: string;
  searchText: (item: T) => string;
  statusOf?: (item: T) => string;
  filterLabel?: string;
  filterOptions?: readonly { value: string; label: string; matches: (item: T) => boolean }[];
  compact?: boolean;
  renderItem: (item: T) => ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon?: IconName;
};

export function DetailList<T>({ items, itemLabel, itemPlural, searchPlaceholder, searchText, statusOf, filterLabel = "situação", filterOptions, compact = false, renderItem, emptyTitle, emptyDescription, emptyIcon = "search" }: Props<T>) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const statuses = useMemo(() => statusOf ? [...new Set(items.map(statusOf))].filter(Boolean) : [], [items, statusOf]);
  const filters = filterOptions ?? statuses.map((value) => ({ value, label: apiLabel(value), matches: (item: T) => statusOf?.(item) === value }));
  const filtered = useMemo(() => {
    const selected = filters.find((option) => option.value === status);
    return filterDetailItems(items, query, searchText, selected?.matches);
  }, [filters, items, query, searchText, status]);
  const page = useClientPagination(filtered, `${query}:${status}`);

  return <>
    <div className={`flex flex-col gap-3 border-y border-[var(--inat-line)] bg-[var(--inat-mist)]/55 p-3 ${compact ? "" : "sm:flex-row sm:items-center sm:justify-between sm:px-5"}`}>
      <div className="relative min-w-0 flex-1">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={160} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="portal-field h-10 w-full bg-white pl-9 pr-3 text-sm" />
      </div>
      <div className="flex items-center gap-2">
        {filters.length > 1 ? <label className="relative min-w-0 flex-1 sm:flex-none"><span className="sr-only">Filtrar por {filterLabel}</span><Icon name="filter" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]" /><select value={status} onChange={(event) => setStatus(event.target.value)} className={`portal-field h-10 w-full appearance-none bg-white pl-9 pr-9 text-sm ${compact ? "" : "sm:w-44"}`}><option value="">Todos</option>{filters.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Icon name="chevron-down" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]" /></label> : null}
        {(query || status) ? <button type="button" onClick={() => { setQuery(""); setStatus(""); }} className="portal-button portal-button-quiet h-10 shrink-0 text-xs">Limpar</button> : null}
        <span className={`${compact ? "hidden" : "hidden lg:inline"} whitespace-nowrap font-mono text-xs text-[var(--inat-muted)]`}>{filtered.length} {filtered.length === 1 ? itemLabel : itemPlural}</span>
      </div>
    </div>
    {filtered.length ? <div className="divide-y divide-[var(--inat-line)]">{page.items.map(renderItem)}</div> : <EmptyState title={items.length ? "Nenhum resultado neste filtro" : emptyTitle} description={items.length ? "Revise os termos da busca ou a situação selecionada." : emptyDescription} icon={items.length ? "search" : emptyIcon} />}
    {page.controls}
  </>;
}
