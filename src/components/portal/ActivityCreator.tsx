"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SearchSelect } from "@/components/design-system/SearchSelect";
import { Icon } from "@/components/design-system/Icon";
import { postJson, requestErrorMessage } from "@/lib/api/client";
import type { Activity, ActivityStatus, Lesson } from "@/lib/api/domain-contracts";

export function ActivityCreator({ lesson }: { lesson?: Pick<Lesson, "id" | "title" | "status"> }) {
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
    const lessonId = lesson?.id ?? String(form.get("lessonId") ?? "");
    const availableDate = new Date(availableAt);
    const dueDate = new Date(dueAt);

    if (!lessonId || lesson?.status === "CANCELLED") {
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
          disabled={lesson?.status === "CANCELLED"}
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
              <label><span className="portal-label">Aula</span><SearchSelect name="lessonId" label="Aula" endpoint="/api/backend/lookups/lessons?purpose=activity" initialOption={lesson ? { id: lesson.id, label: lesson.title } : undefined} disabled={!!lesson} required /><span className="mt-1.5 block text-xs text-[var(--inat-muted)]">{lesson ? "Esta atividade será vinculada à aula atual." : "Aulas canceladas não aparecem porque não aceitam atividades."}</span></label>
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
