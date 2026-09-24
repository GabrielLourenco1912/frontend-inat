"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/design-system/Icon";
import { PageHeader, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import type { DeliveryMode, Lesson } from "@/lib/api/domain-contracts";
import { apiLabel, formatTime } from "@/lib/api/format";

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" });
const monthYear = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });

function localDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function weekDays(value: string) {
  const selected = new Date(`${value}T12:00:00Z`);
  const mondayOffset = (selected.getUTCDay() + 6) % 7;
  const monday = new Date(selected);
  monday.setUTCDate(selected.getUTCDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return date;
  });
}

export function AgendaView({ lessons, canManage }: { lessons: Lesson[]; canManage: boolean }) {
  const initialDate = lessons[0] ? localDateKey(lessons[0].startsAt) : localDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [modality, setModality] = useState<"ALL" | DeliveryMode>("ALL");
  const [view, setView] = useState<"Semana" | "Mês">("Semana");
  const days = weekDays(selectedDate);
  const selectedMonth = selectedDate.slice(0, 7);

  const visibleLessons = useMemo(
    () =>
      lessons.filter((lesson) => {
        const date = localDateKey(lesson.startsAt);
        const dateMatches = view === "Mês" ? date.startsWith(selectedMonth) : date === selectedDate;
        return dateMatches && (modality === "ALL" || lesson.deliveryMode === modality);
      }),
    [lessons, modality, selectedDate, selectedMonth, view],
  );

  function moveWeek(daysToAdd: number) {
    const date = new Date(`${selectedDate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + daysToAdd);
    setSelectedDate(localDateKey(date));
  }

  return (
    <>
      <PageHeader
        eyebrow="Acadêmico"
        title="Agenda"
        description="Aulas acessíveis carregadas diretamente do backend."
        action={canManage ? <Link href="/sistema/aulas" className="portal-button portal-button-primary"><Icon name="plus" className="size-4" />Gerenciar aulas</Link> : undefined}
      />
      <Sheet>
        <div className="flex flex-col gap-3 border-b border-[var(--inat-line)] bg-[var(--inat-mist)]/55 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => moveWeek(view === "Semana" ? -7 : -30)} className="grid size-9 place-items-center border border-[var(--inat-line)] bg-white" aria-label="Período anterior"><Icon name="arrow-left" className="size-4" /></button>
            <div className="min-w-44 text-center"><p className="text-sm font-semibold capitalize">{monthYear.format(new Date(`${selectedDate}T12:00:00Z`))}</p><p className="mt-0.5 font-mono text-[0.625rem] text-[var(--inat-muted)]">{lessons.length} aulas carregadas</p></div>
            <button type="button" onClick={() => moveWeek(view === "Semana" ? 7 : 30)} className="grid size-9 place-items-center border border-[var(--inat-line)] bg-white" aria-label="Próximo período"><Icon name="arrow-right" className="size-4" /></button>
          </div>
          <div className="flex gap-2">
            <select value={modality} onChange={(event) => setModality(event.target.value as "ALL" | DeliveryMode)} className="portal-field h-9 bg-white px-3 text-xs" aria-label="Modalidade"><option value="ALL">Todas</option><option value="ONSITE">Presencial</option><option value="ONLINE">Online</option></select>
            <div className="flex border border-[var(--inat-line)] bg-white p-0.5">{(["Semana", "Mês"] as const).map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`px-3 py-1.5 text-xs font-semibold ${view === item ? "bg-[var(--inat-ink)] text-white" : "text-[var(--inat-muted)]"}`}>{item}</button>)}</div>
          </div>
        </div>
        {view === "Semana" ? <div className="grid grid-cols-7 border-b border-[var(--inat-line)]">{days.map((day) => { const key = localDateKey(day); const active = key === selectedDate; return <button key={key} type="button" onClick={() => setSelectedDate(key)} className={`grid min-h-16 place-items-center border-r border-[var(--inat-line)] px-1 py-2 last:border-r-0 sm:min-h-20 ${active ? "bg-[var(--inat-ink)] text-white" : "bg-white hover:bg-[var(--inat-mist)]/50"}`}><span><span className={`block text-[0.5625rem] font-bold uppercase ${active ? "text-white/55" : "text-[var(--inat-muted)]"}`}>{weekday.format(day).replace(".", "")}</span><span className="mt-1 block font-mono text-lg font-semibold">{day.getUTCDate()}</span></span></button>; })}</div> : <div className="border-b border-[var(--inat-line)] bg-white px-4 py-3 text-xs text-[var(--inat-muted)]">Todas as aulas de {monthYear.format(new Date(`${selectedDate}T12:00:00Z`))}</div>}
        <div className="min-h-72">{visibleLessons.length ? <div className="divide-y divide-[var(--inat-line)]">{visibleLessons.map((lesson) => <Link key={lesson.id} href={`/sistema/aulas/${lesson.id}`} className="group grid gap-3 p-4 hover:bg-[var(--inat-mist)]/35 sm:grid-cols-[7.5rem_1fr_auto] sm:items-center sm:gap-5 sm:px-5"><div><p className="font-mono text-base font-semibold">{formatTime(lesson.startsAt)}</p><p className="mt-0.5 font-mono text-[0.625rem] text-[var(--inat-muted)]">até {formatTime(lesson.endsAt)}</p></div><div className="min-w-0 border-l-2 border-[var(--inat-teal)] pl-4">{view === "Mês" ? <p className="mb-1 font-mono text-[0.625rem] font-bold uppercase text-[var(--inat-clay)]">{dayMonth.format(new Date(lesson.startsAt))}</p> : null}<h3 className="truncate text-sm font-semibold group-hover:text-[var(--inat-teal-dark)]">{lesson.title}</h3><p className="mt-1 truncate text-xs text-[var(--inat-muted)]">Turma {lesson.cohortId} · {apiLabel(lesson.deliveryMode)} · {lesson.deliveryMode === "ONLINE" ? lesson.meetingUrl || "Sem link" : lesson.room || "Sem sala"}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><StatusMark>{apiLabel(lesson.status)}</StatusMark><Icon name="chevron-right" className="size-4 text-[var(--inat-muted)]" /></div></Link>)}</div> : <div className="grid min-h-72 place-items-center p-8 text-center"><div><Icon name="calendar" className="mx-auto size-7 text-[var(--inat-teal)]" /><h2 className="mt-4 font-semibold">Nenhuma aula neste período</h2><p className="mt-2 text-sm text-[var(--inat-muted)]">Escolha outra data ou modalidade.</p></div></div>}</div>
      </Sheet>
    </>
  );
}
