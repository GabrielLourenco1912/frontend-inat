"use client";

import { SearchSelect } from "@/components/design-system/SearchSelect";

import { ServerSearch } from "@/components/design-system/ServerSearch";
import { ListPagination } from "@/components/design-system/ListPagination";
import type { Pagination } from "@/lib/pagination";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { PageHeader, StatusMark } from "@/components/design-system/PortalPrimitives";
import { postJson, requestErrorMessage } from "@/lib/api/client";
import type {
  Activity,
  ActivityStatus,
  ActivitySubmission,
  Lesson,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime } from "@/lib/api/format";

function ActivityCreator() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const availableAt = String(form.get("availableAt") ?? "");
    const dueAt = String(form.get("dueAt") ?? "");
    const maxScore = String(form.get("maxScore") ?? "");
    const lessonId = String(form.get("lessonId") ?? "");
    const availableDate = new Date(availableAt);
    const dueDate = new Date(dueAt);

    if (!lessonId) {
      setError("Selecione uma aula não cancelada.");
      return;
    }
    if (
      Number.isNaN(availableDate.getTime()) ||
      Number.isNaN(dueDate.getTime()) ||
      dueDate.getTime() <= availableDate.getTime()
    ) {
      setError("O prazo deve ser posterior à data de disponibilidade.");
      return;
    }

    setSubmitting(true);
    try {
      await postJson<Activity>("/api/backend/activities", {
        lessonId,
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        availableAt: availableDate.toISOString(),
        dueAt: dueDate.toISOString(),
        maxScore: maxScore ? Number(maxScore.replace(",", ".")) : null,
        status: String(form.get("status") ?? "DRAFT") as ActivityStatus,
      });
      setOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível criar a atividade."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="portal-button portal-button-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="plus" className="size-4" />Nova atividade
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="activity-form-title">
          <form onSubmit={submit} className="my-auto w-full max-w-2xl border border-[var(--inat-line)] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--inat-line)] p-4 sm:px-5"><div><p className="font-mono text-[0.625rem] font-bold uppercase tracking-[.12em] text-[var(--inat-teal-dark)]">Aprendizagem</p><h2 id="activity-form-title" className="mt-1 text-lg font-semibold">Nova atividade</h2></div><button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center text-xl" aria-label="Fechar">×</button></div>
            <div className="grid max-h-[72svh] gap-4 overflow-y-auto p-5">
              {error ? <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
              <label><span className="portal-label">Aula</span><SearchSelect name="lessonId" label="Aula" endpoint="/api/backend/lookups/lessons?purpose=activity" required /><span className="mt-1.5 block text-xs text-[var(--inat-muted)]">Aulas canceladas não aparecem porque não aceitam atividades.</span></label>
              <label><span className="portal-label">Título</span><input name="title" maxLength={160} className="portal-field mt-2 h-10 w-full px-3" required /></label>
              <label><span className="portal-label">Enunciado</span><textarea name="description" rows={6} className="portal-field mt-2 w-full px-3 py-2" required /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label><span className="portal-label">Disponível em</span><input name="availableAt" type="datetime-local" className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Prazo</span><input name="dueAt" type="datetime-local" className="portal-field mt-2 h-10 w-full px-3" required /></label></div>
              <div className="grid gap-4 sm:grid-cols-2"><label><span className="portal-label">Nota máxima (opcional)</span><input name="maxScore" type="number" min="0" step="0.01" className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Estado inicial</span><select name="status" defaultValue="DRAFT" className="portal-field mt-2 h-10 w-full px-3"><option value="DRAFT">Rascunho</option><option value="PUBLISHED">Publicada</option></select></label></div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[var(--inat-line)] p-4"><button type="button" onClick={() => setOpen(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={submitting} className="portal-button portal-button-clay disabled:opacity-60">{submitting ? "Criando..." : "Criar atividade"}</button></div>
          </form>
        </div>
      ) : null}
    </>
  );
}

export function ActivitiesView({
  activities,
  pagination,
  lessons,
  submissions,
  learner,
  canManage,
}: {
  activities: Activity[];
  pagination?: Pagination;
  lessons: Lesson[];
  submissions: ActivitySubmission[];
  learner: boolean;
  canManage: boolean;
}) {
  const filters = learner
    ? ["Todas", "A fazer", "Devolvidas", "Enviadas", "Avaliadas", "Canceladas"]
    : ["Todas", "Rascunhos", "Publicadas", "Para corrigir", "Encerradas", "Canceladas"];
  const [filter, setFilter] = useState("Todas");
  const [query, setQuery] = useState("");
  const lessonMap = useMemo(
    () => new Map(lessons.map((lesson) => [lesson.id, lesson])),
    [lessons],
  );
  const submissionByActivity = useMemo(
    () => new Map(submissions.map((submission) => [submission.activityId, submission])),
    [submissions],
  );

  const visible = useMemo(() => {
    const normalized = query.toLocaleLowerCase("pt-BR");
    return activities.filter((activity) => {
      const submission = submissionByActivity.get(activity.id);
      const matchesQuery = `${activity.title} ${lessonMap.get(activity.lessonId)?.title ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalized);
      if (!matchesQuery || filter === "Todas") return matchesQuery;
      if (filter === "Para corrigir") return submissions.some((item) => item.activityId === activity.id && ["SUBMITTED", "LATE"].includes(item.status));
      if (filter === "A fazer") return activity.status === "PUBLISHED" && !submission;
      if (filter === "Devolvidas") return submission?.status === "RETURNED";
      if (filter === "Enviadas") return submission && ["SUBMITTED", "LATE"].includes(submission.status);
      if (filter === "Avaliadas") return submission?.status === "GRADED";
      if (filter === "Rascunhos") return activity.status === "DRAFT";
      if (filter === "Publicadas") return activity.status === "PUBLISHED";
      if (filter === "Encerradas") return activity.status === "CLOSED";
      if (filter === "Canceladas") return activity.status === "CANCELLED";
      return true;
    });
  }, [activities, filter, lessonMap, query, submissionByActivity, submissions]);

  return (
    <>
      <PageHeader
        eyebrow="Aprendizagem"
        title={learner ? "Minhas atividades" : "Atividades e correções"}
        description={learner ? "Prazos, devolutivas e entregas carregados do backend." : "Publicação, entregas e correções organizadas pelo estado real."}
        action={canManage ? <ActivityCreator /> : undefined}
      />
      <div className="border border-[var(--inat-line)] bg-white">
        <div className="overflow-x-auto border-b border-[var(--inat-line)]"><div className="flex min-w-max" role="tablist" aria-label="Filtrar atividades">{filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`relative min-h-11 px-4 text-sm font-semibold ${filter === item ? "text-[var(--inat-teal-dark)]" : "text-[var(--inat-muted)]"}`} aria-selected={filter === item} role="tab">{item}{filter === item ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[var(--inat-clay)]" /> : null}</button>)}</div></div>
        <div className="border-b border-[var(--inat-line)] bg-[var(--inat-mist)]/55 p-3 sm:p-4">{pagination ? <ServerSearch key={pagination.search} initialQuery={pagination.search} placeholder="Buscar atividade ou aula" /> : <div className="relative max-w-md"><Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar atividade ou aula nesta página" className="portal-field h-10 w-full bg-white pl-9 pr-3 text-sm" /></div>}</div>
        {pagination ? <p className="px-4 py-2 text-xs text-[var(--inat-muted)]">A busca consulta todas as atividades acessíveis. Os filtros de estado se aplicam à página atual.</p> : null}
        <div className="divide-y divide-[var(--inat-line)]">
          {visible.length ? visible.map((activity) => {
            const submission = submissionByActivity.get(activity.id);
            const pendingReviews = submissions.filter((item) => item.activityId === activity.id && ["SUBMITTED", "LATE"].includes(item.status)).length;
            return <Link key={activity.id} href={`/sistema/atividades/${activity.id}`} className="group grid gap-4 p-4 hover:bg-[var(--inat-mist)]/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"><div className="flex min-w-0 gap-3"><span className="grid size-10 shrink-0 place-items-center bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]"><Icon name="clipboard" className="size-[1.125rem]" /></span><div className="min-w-0"><h2 className="truncate text-sm font-semibold group-hover:text-[var(--inat-teal-dark)]">{activity.title}</h2><p className="mt-1 truncate text-xs text-[var(--inat-muted)]">{lessonMap.get(activity.lessonId)?.title ?? `Aula ${activity.lessonId}`}</p><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.625rem] text-[var(--inat-muted)]"><span>Disponível {formatDateTime(activity.availableAt)}</span><span>Prazo {formatDateTime(activity.dueAt)}</span></div></div></div><div className="flex items-center justify-between gap-4 sm:justify-end">{learner && submission ? <span className="text-xs text-[var(--inat-muted)]">{apiLabel(submission.status)}</span> : !learner && pendingReviews ? <span className="text-xs"><strong className="font-mono">{pendingReviews}</strong> para corrigir</span> : null}<StatusMark>{apiLabel(activity.status)}</StatusMark><Icon name="chevron-right" className="size-4 text-[var(--inat-muted)]" /></div></Link>;
          }) : <div className="grid min-h-56 place-items-center p-8 text-center"><div><Icon name="clipboard" className="mx-auto size-7 text-[var(--inat-teal)]" /><h2 className="mt-4 font-semibold">{activities.length ? "Nenhuma atividade neste filtro" : "Nenhuma atividade disponível"}</h2><p className="mt-2 text-sm text-[var(--inat-muted)]">{activities.length ? "Escolha outro estado ou limpe a busca." : "O backend ainda não retornou atividades para suas aulas."}</p></div></div>}
        </div>
      </div>
      {pagination ? <ListPagination shown={visible.length} {...pagination} /> : null}
    </>
  );
}
