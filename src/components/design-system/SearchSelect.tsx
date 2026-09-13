"use client";

import { useEffect, useId, useRef, useState } from "react";
import { apiRequest, requestErrorMessage } from "@/lib/api/client";
import type { PageResponse } from "@/lib/api/contracts";

export type SearchOption = { id: string; label: string };

export function SearchSelect({ name, label, endpoint, required = false, disabled = false,
  initialOption, onSelect }: {
  name: string;
  label: string;
  endpoint: string;
  required?: boolean;
  disabled?: boolean;
  initialOption?: SearchOption;
  onSelect?: (option: SearchOption | undefined) => void;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(initialOption);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [active, setActive] = useState(0);
  const [retry, setRetry] = useState(0);
  const [response, setResponse] = useState<{ key: string; data?: PageResponse<SearchOption>; error?: string }>();
  const key = `${endpoint}:${query}:${page}:${retry}`;
  const current = response?.key === key ? response : undefined;
  const options = current?.data?.content ?? [];
  const loading = open && !current;

  useEffect(() => {
    input.current?.setCustomValidity(!selected && (required || query) ? "Selecione um item nos resultados da busca." : "");
  }, [selected, required, query]);

  useEffect(() => {
    if (!open || disabled) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const separator = endpoint.includes("?") ? "&" : "?";
      const params = new URLSearchParams({ q: query.trim(), page: String(page), size: "5" });
      try {
        const data = await apiRequest<PageResponse<SearchOption>>(`${endpoint}${separator}${params}`, { signal: controller.signal });
        if (!controller.signal.aborted) setResponse({ key, data });
      } catch (error) {
        if (!controller.signal.aborted) setResponse({ key, error: requestErrorMessage(error, "Não foi possível buscar as opções.") });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [endpoint, query, page, open, disabled, key]);

  function choose(option: SearchOption) {
    setSelected(option); setQuery(""); setOpen(false); setPage(0); setActive(0);
    onSelect?.(option);
  }
  function clear() {
    setSelected(undefined); setQuery(""); setPage(0); setActive(0);
    onSelect?.(undefined); setOpen(true); input.current?.focus();
  }

  return <div className="relative mt-2" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <input type="hidden" name={name} value={selected?.id ?? ""} disabled={disabled} />
    <div className="flex gap-1">
      <input ref={input} type="text" role="combobox" aria-label={label} aria-expanded={open}
        aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        autoComplete="off" required={required} disabled={disabled} maxLength={160}
        value={selected ? selected.label : query} placeholder={`Buscar ${label.toLocaleLowerCase("pt-BR")}`}
        onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
        onChange={(event) => { setSelected(undefined); onSelect?.(undefined); setQuery(event.target.value); setPage(0); setActive(0); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
          if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((index) => Math.min(index + 1, Math.max(0, options.length - 1))); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); }
          if (event.key === "Enter" && open) { event.preventDefault(); if (options[active]) choose(options[active]); }
        }}
        className="portal-field h-10 min-w-0 w-full px-3 disabled:bg-[var(--inat-paper)]" />
      {selected || query ? <button type="button" onClick={clear} disabled={disabled} aria-label={`Limpar ${label}`} className="portal-button portal-button-quiet h-10 px-2">×</button> : null}
    </div>
    {open ? <div className="absolute inset-x-0 top-full z-20 mt-1 border border-[var(--inat-line)] bg-white shadow-lg">
      {loading ? <p role="status" className="p-3 text-sm text-[var(--inat-muted)]">Buscando...</p> : null}
      {current?.error ? <div className="p-3"><p role="alert" className="text-sm text-rose-700">{current.error}</p><button type="button" className="portal-button portal-button-secondary mt-2 h-8" onClick={() => setRetry((value) => value + 1)}>Tentar novamente</button></div> : null}
      <ul id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto">
        {options.map((option, index) => <li id={`${listId}-${index}`} key={option.id} role="option" aria-selected={selected?.id === option.id}
          onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)} onMouseMove={() => setActive(index)}
          className={`cursor-pointer px-3 py-2.5 text-sm ${active === index ? "bg-[var(--inat-mist)]" : "hover:bg-[var(--inat-paper)]"}`}>{option.label}</li>)}
      </ul>
      {current?.data && !options.length ? <p role="status" className="p-3 text-sm text-[var(--inat-muted)]">Nenhum resultado encontrado.</p> : null}
      {current?.data ? <div className="flex items-center justify-between gap-2 border-t border-[var(--inat-line)] px-3 py-2 text-xs">
        <span>{options.length} de {current.data.totalElements} resultado(s)</span>
        <div className="flex gap-2">
          {!current.data.first ? <button type="button" aria-label="Resultados anteriores" className="portal-button portal-button-quiet h-8" onClick={() => { setPage((value) => value - 1); setActive(0); }}>Anterior</button> : null}
          {!current.data.last ? <button type="button" aria-label="Próximos resultados" className="portal-button portal-button-quiet h-8" onClick={() => { setPage((value) => value + 1); setActive(0); }}>Próximos</button> : null}
        </div>
      </div> : null}
    </div> : null}
  </div>;
}
