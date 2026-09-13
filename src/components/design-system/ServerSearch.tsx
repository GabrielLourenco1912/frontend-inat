"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ServerSearch({ initialQuery = "", placeholder = "Buscar registros" }: { initialQuery?: string; placeholder?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  function search(value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value.trim()) params.set("q", value.trim()); else params.delete("q");
    params.set("page", "1");
    startTransition(() => router.push(`?${params}`, { scroll: false }));
  }
  return <form role="search" onSubmit={(event) => { event.preventDefault(); search(query); }} className="flex min-w-0 flex-1 gap-2 sm:max-w-lg" aria-busy={pending}>
    <input type="search" value={query} maxLength={160} onChange={(event) => setQuery(event.target.value)}
      aria-label={placeholder} placeholder={placeholder} className="portal-field h-10 min-w-0 flex-1 bg-white px-3" />
    <button type="submit" disabled={pending} className="portal-button portal-button-secondary h-10">{pending ? "Buscando..." : "Buscar"}</button>
    {initialQuery ? <button type="button" disabled={pending} onClick={() => { setQuery(""); search(""); }} className="portal-button portal-button-quiet h-10">Limpar</button> : null}
  </form>;
}
