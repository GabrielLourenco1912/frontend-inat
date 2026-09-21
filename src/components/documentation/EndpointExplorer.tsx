"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/design-system/Icon";
import {
  accessDescriptions,
  accessLabels,
  apiGroups,
  type AccessLevel,
  type ApiEndpoint,
  type HttpMethod,
} from "@/lib/documentation/backend-catalog";

type AccessFilter = "all" | AccessLevel;

const accessFilters: Array<{ value: AccessFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "public", label: "Públicos" },
  { value: "authenticated", label: "Autenticados" },
  { value: "admin", label: "ADMIN" },
  { value: "contextual", label: "Contextuais" },
];

const methodStyles: Record<HttpMethod, string> = {
  GET: "border-sky-200 bg-sky-50 text-sky-700",
  POST: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PUT: "border-amber-200 bg-amber-50 text-amber-700",
  PATCH: "border-violet-200 bg-violet-50 text-violet-700",
  DELETE: "border-rose-200 bg-rose-50 text-rose-700",
};

const accessStyles: Record<AccessLevel, string> = {
  public: "border-emerald-200 bg-emerald-50 text-emerald-700",
  authenticated: "border-slate-200 bg-slate-50 text-slate-600",
  admin: "border-orange-200 bg-orange-50 text-orange-700",
  contextual: "border-teal-200 bg-teal-50 text-teal-700",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesSearch(endpoint: ApiEndpoint, groupName: string, query: string) {
  if (!query) return true;
  const searchable = [
    endpoint.method,
    endpoint.path,
    endpoint.summary,
    endpoint.request,
    endpoint.response,
    endpoint.note,
    groupName,
    accessLabels[endpoint.access],
    ...(endpoint.parameters ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  return normalize(searchable).includes(normalize(query));
}

function EndpointRow({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <details className="group border-b border-[var(--inat-line)] bg-white last:border-b-0 open:bg-[#fbfdfc]">
      <summary className="grid cursor-pointer list-none gap-3 px-4 py-4 transition hover:bg-[var(--inat-mist)]/55 sm:grid-cols-[5rem_minmax(0,1fr)_auto_auto] sm:items-center sm:px-5 [&::-webkit-details-marker]:hidden">
        <span
          className={`inline-flex w-fit min-w-[4.25rem] justify-center rounded border px-2 py-1 font-mono text-[0.6875rem] font-black tracking-[0.08em] ${methodStyles[endpoint.method]}`}
        >
          {endpoint.method}
        </span>

        <span className="min-w-0">
          <code className="block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs font-semibold text-[var(--inat-ink)] sm:text-[0.8125rem]">
            {endpoint.path}
          </code>
          <span className="mt-1 block text-xs text-[var(--inat-muted)] sm:hidden">
            {endpoint.summary}
          </span>
        </span>

        <span className="hidden max-w-64 text-right text-xs text-[var(--inat-muted)] lg:block">
          {endpoint.summary}
        </span>

        <span className="flex items-center justify-between gap-2 sm:justify-end">
          <span
            className={`rounded-full border px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] ${accessStyles[endpoint.access]}`}
          >
            {accessLabels[endpoint.access]}
          </span>
          <Icon
            name="chevron-down"
            className="size-4 shrink-0 text-[var(--inat-muted)] transition-transform group-open:rotate-180"
          />
        </span>
      </summary>

      <div className="border-t border-[var(--inat-line)] px-4 py-5 sm:px-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,.72fr)]">
          <div>
            <p className="text-sm font-semibold text-[var(--inat-ink)]">
              {endpoint.summary}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--inat-muted)]">
              {accessDescriptions[endpoint.access]}
            </p>

            {endpoint.note ? (
              <div className="mt-4 flex gap-3 rounded-md border border-[#efd5c7] bg-[#fff7f2] p-3 text-sm leading-6 text-[#744127]">
                <Icon name="spark" className="mt-0.5 size-4 shrink-0" />
                <p>{endpoint.note}</p>
              </div>
            ) : null}

            {endpoint.parameters?.length ? (
              <div className="mt-5">
                <h4 className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-muted)]">
                  Parâmetros
                </h4>
                <ul className="mt-2 grid gap-2">
                  {endpoint.parameters.map((parameter) => (
                    <li
                      key={parameter}
                      className="flex gap-2 text-xs leading-5 text-[var(--inat-muted)]"
                    >
                      <span className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-[var(--inat-teal)]" />
                      {parameter}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <dl className="grid content-start gap-px overflow-hidden rounded-md border border-[var(--inat-line)] bg-[var(--inat-line)] text-xs">
            <div className="grid grid-cols-[6.75rem_1fr] bg-white">
              <dt className="px-3 py-2.5 font-semibold text-[var(--inat-muted)]">Autorização</dt>
              <dd className="px-3 py-2.5 font-mono font-semibold text-[var(--inat-ink)]">
                {accessLabels[endpoint.access]}
              </dd>
            </div>
            <div className="grid grid-cols-[6.75rem_1fr] bg-white">
              <dt className="px-3 py-2.5 font-semibold text-[var(--inat-muted)]">Requisição</dt>
              <dd className="break-words px-3 py-2.5 font-mono text-[var(--inat-ink)]">
                {endpoint.request ?? "Sem corpo"}
              </dd>
            </div>
            <div className="grid grid-cols-[6.75rem_1fr] bg-white">
              <dt className="px-3 py-2.5 font-semibold text-[var(--inat-muted)]">Content-Type</dt>
              <dd className="break-words px-3 py-2.5 font-mono text-[var(--inat-ink)]">
                {endpoint.contentType ?? "—"}
              </dd>
            </div>
            <div className="grid grid-cols-[6.75rem_1fr] bg-white">
              <dt className="px-3 py-2.5 font-semibold text-[var(--inat-muted)]">Resposta</dt>
              <dd className="break-words px-3 py-2.5 font-mono text-[var(--inat-ink)]">
                {endpoint.response}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </details>
  );
}

export function EndpointExplorer() {
  const [query, setQuery] = useState("");
  const [access, setAccess] = useState<AccessFilter>("all");
  const [activeGroup, setActiveGroup] = useState("all");

  const filteredGroups = useMemo(
    () =>
      apiGroups
        .filter((group) => activeGroup === "all" || group.id === activeGroup)
        .map((group) => ({
          ...group,
          endpoints: group.endpoints.filter(
            (item) =>
              (access === "all" || item.access === access) &&
              matchesSearch(item, group.name, query.trim()),
          ),
        }))
        .filter((group) => group.endpoints.length > 0),
    [access, activeGroup, query],
  );

  const visibleCount = filteredGroups.reduce(
    (total, group) => total + group.endpoints.length,
    0,
  );
  const hasFilters = query || access !== "all" || activeGroup !== "all";

  const clearFilters = () => {
    setQuery("");
    setAccess("all");
    setActiveGroup("all");
  };

  return (
    <div className="mt-10">
      <div className="rounded-lg border border-[var(--inat-line)] bg-white p-4 shadow-[0_24px_70px_-55px_rgba(32,52,54,.65)] sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-[var(--inat-ink)]">
              Pesquisar na API
            </span>
            <span className="relative block">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex.: frequência, /api/lessons, multipart..."
                className="portal-field min-h-12 w-full bg-white pl-10 pr-4 text-sm"
              />
            </span>
          </label>

          <div>
            <span className="mb-2 block text-xs font-bold text-[var(--inat-ink)]">
              Nível de acesso
            </span>
            <div className="flex flex-wrap gap-2" aria-label="Filtrar pelo nível de acesso">
              {accessFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setAccess(filter.value)}
                  aria-pressed={access === filter.value}
                  className={`min-h-10 rounded border px-3 text-xs font-bold transition ${
                    access === filter.value
                      ? "border-[var(--inat-ink)] bg-[var(--inat-ink)] text-white"
                      : "border-[var(--inat-line-strong)] bg-white text-[var(--inat-muted)] hover:border-[var(--inat-teal)] hover:text-[var(--inat-ink)]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-[var(--inat-line)] pt-4">
          <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar por domínio">
            <button
              type="button"
              onClick={() => setActiveGroup("all")}
              aria-pressed={activeGroup === "all"}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                activeGroup === "all"
                  ? "border-[var(--inat-teal)] bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]"
                  : "border-[var(--inat-line)] text-[var(--inat-muted)] hover:border-[var(--inat-line-strong)]"
              }`}
            >
              Todos os domínios
            </button>
            {apiGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group.id)}
                aria-pressed={activeGroup === group.id}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  activeGroup === group.id
                    ? "border-[var(--inat-teal)] bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]"
                    : "border-[var(--inat-line)] text-[var(--inat-muted)] hover:border-[var(--inat-line-strong)]"
                }`}
              >
                {group.name}
                <span className="ml-1.5 opacity-60">{group.endpoints.length}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--inat-muted)]">
        <p aria-live="polite">
          <strong className="font-semibold text-[var(--inat-ink)]">{visibleCount}</strong>{" "}
          {visibleCount === 1 ? "operação encontrada" : "operações encontradas"}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--inat-teal-dark)] hover:underline"
          >
            <Icon name="close" className="size-3.5" />
            Limpar filtros
          </button>
        ) : null}
      </div>

      {filteredGroups.length ? (
        <div className="mt-5 grid gap-7">
          {filteredGroups.map((group) => (
            <section key={group.id} aria-labelledby={`api-group-${group.id}`}>
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3
                    id={`api-group-${group.id}`}
                    className="text-lg font-bold tracking-[-0.02em] text-[var(--inat-ink)]"
                  >
                    {group.name}
                  </h3>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--inat-muted)]">
                    {group.description}
                  </p>
                </div>
                <span className="font-mono text-[0.6875rem] font-semibold text-[var(--inat-muted)]">
                  {group.endpoints.length} {group.endpoints.length === 1 ? "operação" : "operações"}
                </span>
              </div>

              <div className="overflow-hidden rounded-lg border border-[var(--inat-line)] shadow-[0_18px_50px_-45px_rgba(32,52,54,.6)]">
                {group.endpoints.map((item) => (
                  <EndpointRow key={`${item.method}-${item.path}`} endpoint={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[var(--inat-line-strong)] bg-white px-6 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
            <Icon name="search" className="size-5" />
          </span>
          <h3 className="mt-4 font-semibold text-[var(--inat-ink)]">Nenhuma operação encontrada</h3>
          <p className="mt-1 text-sm text-[var(--inat-muted)]">
            Ajuste o termo, o domínio ou o nível de acesso.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="portal-button portal-button-secondary mt-5"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
