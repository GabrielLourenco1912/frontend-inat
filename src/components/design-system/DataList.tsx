"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/design-system/Icon";
import { ListPagination, type ListPaginationProps } from "@/components/design-system/ListPagination";
import { EmptyState, StatusMark } from "@/components/design-system/PortalPrimitives";

export type DataRecord = {
  id: string;
  href?: string;
  [key: string]: string | undefined;
};

export type DataColumn = {
  key: string;
  label: string;
  primary?: boolean;
  mono?: boolean;
  hideBelow?: "md" | "lg";
};

export function DataList({
  records,
  columns,
  searchPlaceholder = "Buscar nesta página",
  statusKey = "state",
  itemLabel = "registro",
  localSearchNote = true,
  searchable = true,
  pagination,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  records: DataRecord[];
  columns: DataColumn[];
  searchPlaceholder?: string;
  statusKey?: string;
  itemLabel?: string;
  localSearchNote?: boolean;
  searchable?: boolean;
  pagination?: Omit<ListPaginationProps, "shown">;
  emptyIcon?: IconName;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");

  const statuses = useMemo(
    () =>
      Array.from(
        new Set(records.map((record) => record[statusKey]).filter(Boolean)),
      ) as string[],
    [records, statusKey],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return records.filter((record) => {
      const matchesQuery =
        !normalized ||
        Object.values(record).some((value) =>
          value?.toLocaleLowerCase("pt-BR").includes(normalized),
        );
      const matchesStatus =
        status === "Todos" || record[statusKey] === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, records, status, statusKey]);

  const primary = columns.find((column) => column.primary) ?? columns[0];
  const secondary = columns.filter(
    (column) => column.key !== primary.key && column.key !== statusKey,
  );

  return (
    <div className="border border-[var(--inat-line)] bg-white">
      {searchable ? <div className="flex flex-col gap-3 border-b border-[var(--inat-line)] bg-[var(--inat-mist)]/55 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="portal-field h-10 w-full bg-white pl-9 pr-3 text-sm"
            aria-label={searchPlaceholder}
          />
        </div>
        <div className="flex items-center gap-2">
          {statuses.length > 1 ? (
            <label className="relative flex-1 sm:flex-none">
              <span className="sr-only">Filtrar por estado</span>
              <Icon
                name="filter"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="portal-field h-10 w-full appearance-none bg-white pl-9 pr-9 text-sm sm:w-44"
              >
                <option>Todos</option>
                {statuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]"
              />
            </label>
          ) : null}
          <span className="hidden whitespace-nowrap font-mono text-xs text-[var(--inat-muted)] sm:inline">
            {filtered.length} {filtered.length === 1 ? itemLabel : `${itemLabel}s`}
          </span>
        </div>
      </div> : null}

      {searchable && localSearchNote ? (
        <div className="border-b border-[var(--inat-line)] bg-white px-4 py-2 text-[0.6875rem] leading-4 text-[var(--inat-muted)]">
          A busca filtra somente os registros carregados nesta página.
        </div>
      ) : null}

      {filtered.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--inat-line)] bg-[var(--inat-paper)]">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`px-4 py-3 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)] ${column.hideBelow === "lg" ? "hidden lg:table-cell" : ""}`}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th scope="col" className="w-12 px-4 py-3">
                    <span className="sr-only">Abrir</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-[var(--inat-line)] last:border-b-0 hover:bg-[var(--inat-mist)]/35"
                  >
                    {columns.map((column) => {
                      const value = record[column.key] ?? "—";
                      return (
                        <td
                          key={column.key}
                          className={`px-4 py-3.5 align-middle text-sm text-[var(--inat-muted)] ${column.hideBelow === "lg" ? "hidden lg:table-cell" : ""} ${column.mono ? "font-mono text-xs" : ""}`}
                        >
                          {column.key === statusKey ? (
                            <StatusMark>{value}</StatusMark>
                          ) : column.primary ? (
                            record.href ? (
                              <Link
                                href={record.href}
                                className="font-semibold text-[var(--inat-ink)] hover:text-[var(--inat-teal-dark)]"
                              >
                                {value}
                              </Link>
                            ) : (
                              <span className="font-semibold text-[var(--inat-ink)]">
                                {value}
                              </span>
                            )
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3.5 text-right">
                      {record.href ? (
                        <Link
                          href={record.href}
                          className="inline-grid size-8 place-items-center text-[var(--inat-muted)] hover:bg-[var(--inat-mist)] hover:text-[var(--inat-teal-dark)]"
                          aria-label={`Abrir ${record[primary.key] ?? itemLabel}`}
                        >
                          <Icon name="chevron-right" className="size-4" />
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[var(--inat-line)] md:hidden">
            {filtered.map((record) => (
              <article key={record.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {record.href ? (
                      <Link
                        href={record.href}
                        className="font-semibold leading-5 text-[var(--inat-ink)]"
                      >
                        {record[primary.key] ?? "Sem título"}
                      </Link>
                    ) : (
                      <h3 className="font-semibold leading-5 text-[var(--inat-ink)]">
                        {record[primary.key] ?? "Sem título"}
                      </h3>
                    )}
                    <dl className="mt-2 grid gap-1.5">
                      {secondary.slice(0, 3).map((column) => (
                        <div
                          key={column.key}
                          className="flex gap-2 text-xs leading-5"
                        >
                          <dt className="shrink-0 text-[var(--inat-muted)]">
                            {column.label}:
                          </dt>
                          <dd
                            className={`min-w-0 text-[var(--inat-ink)] ${column.mono ? "font-mono" : ""}`}
                          >
                            {record[column.key] ?? "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  {record[statusKey] ? (
                    <StatusMark className="shrink-0">
                      {record[statusKey]}
                    </StatusMark>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title={
            records.length === 0
              ? emptyTitle ?? `Nenhum ${itemLabel} disponível`
              : "Nenhum resultado nesta página"
          }
          description={
            records.length === 0
              ? emptyDescription ?? "Ainda não há registros cadastrados no backend."
              : "Revise os termos da busca ou remova o filtro de estado."
          }
          icon={emptyIcon ?? (records.length === 0 ? "folder" : "search")}
        />
      )}

      <ListPagination shown={filtered.length} total={records.length} {...pagination} />
    </div>
  );
}
