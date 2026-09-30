"use client";

import { SearchSelect } from "@/components/design-system/SearchSelect";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { postJson, requestErrorMessage } from "@/lib/api/client";
import { parseSaoPauloDateTimeInput } from "@/lib/api/time-zone";
import type {
  Notification,
  NotificationAudienceType,
  NotificationChannel,
  NotificationPriority,
} from "@/lib/api/domain-contracts";

export function NotificationComposer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<NotificationAudienceType>("USER");
  const [channels, setChannels] = useState<NotificationChannel[]>(["IN_APP"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [advanced, setAdvanced] = useState(false);

  function toggleChannel(channel: NotificationChannel) {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((value) => value !== channel)
        : [...current, channel],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const targetId = String(form.get("targetId") ?? "").trim();

    if (audience !== "ALL" && !targetId) {
      setError("Selecione o destinatário da notificação.");
      return;
    }
    if (!channels.length) {
      setError("Selecione pelo menos um canal de envio.");
      return;
    }

    const scheduledAt = String(form.get("scheduledAt") ?? "");
    const expiresAt = String(form.get("expiresAt") ?? "");
    const contextType = String(form.get("contextType") ?? "").trim();
    const contextId = String(form.get("contextId") ?? "").trim();
    const payload = String(form.get("payload") ?? "").trim();
    if (Boolean(contextType) !== Boolean(contextId)) {
      setError("Tipo e ID de contexto devem ser informados juntos.");
      return;
    }
    if (payload) {
      try {
        JSON.parse(payload);
      } catch {
        setError("O payload técnico precisa ser um JSON válido.");
        return;
      }
    }
    setSubmitting(true);
    try {
      await postJson<Notification>("/api/backend/notifications", {
        notificationType: String(form.get("notificationType") ?? "GENERAL").trim().toUpperCase(),
        title: String(form.get("title") ?? "").trim(),
        message: String(form.get("message") ?? "").trim(),
        actionUrl: String(form.get("actionUrl") ?? "").trim() || null,
        contextType: contextType.toUpperCase() || null,
        contextId: contextId || null,
        payload: payload || null,
        priority: String(form.get("priority") ?? "NORMAL") as NotificationPriority,
        scheduledAt: scheduledAt ? parseSaoPauloDateTimeInput(scheduledAt).toISOString() : null,
        expiresAt: expiresAt ? parseSaoPauloDateTimeInput(expiresAt).toISOString() : null,
        audience: { type: audience, targetId: audience === "ALL" ? null : targetId },
        channels,
      });
      setOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível criar a notificação."));
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="portal-button portal-button-primary">
        <Icon name="plus" className="size-4" />
        Nova comunicação
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="notification-form-title">
          <form onSubmit={submit} className="my-auto w-full max-w-2xl border border-[var(--inat-line)] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[var(--inat-line)] px-5 py-4">
              <div>
                <p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-teal-dark)]">Comunicação</p>
                <h2 id="notification-form-title" className="mt-1 text-lg font-semibold">Criar notificação</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center text-xl text-[var(--inat-muted)]" aria-label="Fechar">×</button>
            </div>
            <div className="grid max-h-[72svh] gap-4 overflow-y-auto p-5">
              {error ? <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm"><span className="portal-label">Tipo técnico</span><input name="notificationType" defaultValue="GENERAL" pattern="[A-Za-z][A-Za-z0-9_]*" maxLength={50} className="portal-field mt-2 h-10 w-full px-3" required /></label>
                <label className="text-sm"><span className="portal-label">Prioridade</span><select name="priority" defaultValue="NORMAL" className="portal-field mt-2 h-10 w-full px-3"><option value="LOW">Baixa</option><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></label>
              </div>
              <div className="border border-[var(--inat-line)]"><button type="button" onClick={() => setAdvanced((value) => !value)} className="flex w-full items-center justify-between p-3 text-left text-sm font-semibold"><span>Contexto e payload técnico</span><Icon name="chevron-down" className={`size-4 transition-transform ${advanced ? "rotate-180" : ""}`} /></button>{advanced ? <div className="grid gap-4 border-t border-[var(--inat-line)] p-4 sm:grid-cols-2"><label className="text-sm"><span className="portal-label">Tipo de contexto</span><input name="contextType" maxLength={50} placeholder="ACTIVITY" className="portal-field mt-2 h-10 w-full px-3 uppercase" /></label><label className="text-sm"><span className="portal-label">ID de contexto</span><input name="contextId" maxLength={26} className="portal-field mt-2 h-10 w-full px-3" /></label><label className="text-sm sm:col-span-2"><span className="portal-label">Payload JSON</span><textarea name="payload" rows={4} placeholder={'{"chave":"valor"}'} className="portal-field mt-2 w-full px-3 py-2 font-mono text-xs" /></label></div> : null}</div>
              <label className="text-sm"><span className="portal-label">Título</span><input name="title" maxLength={160} className="portal-field mt-2 h-10 w-full px-3" required /></label>
              <label className="text-sm"><span className="portal-label">Mensagem</span><textarea name="message" rows={5} className="portal-field mt-2 w-full px-3 py-2" required /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm"><span className="portal-label">Público</span><select value={audience} onChange={(event) => setAudience(event.target.value as NotificationAudienceType)} className="portal-field mt-2 h-10 w-full px-3"><option value="USER">Um usuário</option><option value="COHORT">Uma turma</option><option value="ALL">Todos os usuários ativos</option></select></label>
                {audience !== "ALL" ? <label className="text-sm"><span className="portal-label">Destinatário</span><SearchSelect name="targetId" label="Destinatário" key={audience} endpoint={audience === "USER" ? "/api/backend/lookups/users?purpose=audience-user" : "/api/backend/lookups/cohorts?purpose=audience-cohort"} required /></label> : null}
              </div>
              <fieldset><legend className="portal-label">Canais</legend><div className="mt-2 flex flex-wrap gap-4">{(["IN_APP", "EMAIL"] as const).map((channel) => <label key={channel} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={channels.includes(channel)} onChange={() => toggleChannel(channel)} className="size-4 accent-[var(--inat-teal)]" />{channel === "IN_APP" ? "No portal" : "E-mail"}</label>)}</div></fieldset>
              <label className="text-sm"><span className="portal-label">Ação no portal (opcional)</span><select name="actionUrl" defaultValue="" className="portal-field mt-2 h-10 w-full px-3"><option value="">Sem ação</option><option value="/sistema">Abrir central do dia</option><option value="/sistema/avisos">Abrir avisos</option><option value="/sistema/agenda">Abrir agenda</option><option value="/sistema/aulas">Abrir aulas</option><option value="/sistema/atividades">Abrir atividades</option><option value="/sistema/minha-conta">Abrir minha conta</option></select></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm"><span className="portal-label">Agendar para (opcional)</span><input name="scheduledAt" type="datetime-local" className="portal-field mt-2 h-10 w-full px-3" /></label>
                <label className="text-sm"><span className="portal-label">Expirar em (opcional)</span><input name="expiresAt" type="datetime-local" className="portal-field mt-2 h-10 w-full px-3" /></label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[var(--inat-line)] p-4">
              <button type="button" onClick={() => setOpen(false)} className="portal-button portal-button-secondary">Cancelar</button>
              <button type="submit" disabled={submitting} className="portal-button portal-button-clay disabled:opacity-60"><Icon name="send" className="size-4" />{submitting ? "Criando..." : "Criar notificação"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
