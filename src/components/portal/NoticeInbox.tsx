"use client";

import { ListPagination } from "@/components/design-system/ListPagination";
import type { Pagination } from "@/lib/pagination";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/design-system/Icon";
import { PageHeader, StatusMark } from "@/components/design-system/PortalPrimitives";
import { patchJson } from "@/lib/api/client";
import type { NotificationRecipient } from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime } from "@/lib/api/format";

function safeActionUrl(value: string | null) {
  return value?.startsWith("/sistema") && !value.startsWith("//")
    ? value
    : "/sistema/avisos";
}

export function NoticeInbox({ initialNotices, pagination }: { initialNotices: NotificationRecipient[]; pagination?: Pagination }) {
  const [notices, setNotices] = useState(initialNotices);
  const [filter, setFilter] = useState<"Não lidos" | "Todos">("Não lidos");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const visible = useMemo(
    () => (filter === "Todos" ? notices : notices.filter((notice) => !notice.readAt)),
    [filter, notices],
  );
  const unread = notices.filter((notice) => !notice.readAt).length;

  async function markRead(id: string) {
    setError("");
    try {
      const updated = await patchJson<NotificationRecipient>(
        `/api/backend/notification-recipients/${encodeURIComponent(id)}/read`,
      );
      setNotices((current) => current.map((notice) => (notice.id === id ? updated : notice)));
    } catch {
      setError("Não foi possível marcar o aviso como lido.");
    }
  }

  async function markAllRead() {
    setSaving(true);
    setError("");
    try {
      const unreadItems = notices.filter((notice) => !notice.readAt);
      const updated = await Promise.all(
        unreadItems.map((notice) =>
          patchJson<NotificationRecipient>(
            `/api/backend/notification-recipients/${encodeURIComponent(notice.id)}/read`,
          ),
        ),
      );
      const updatedMap = new Map(updated.map((notice) => [notice.id, notice]));
      setNotices((current) => current.map((notice) => updatedMap.get(notice.id) ?? notice));
    } catch {
      setError("Alguns avisos não puderam ser atualizados. Recarregue a página e tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Caixa pessoal"
        title="Avisos"
        description={`${unread} ${unread === 1 ? "aviso não lido" : "avisos não lidos"}. nesta página.`}
        action={
          unread ? (
            <button
              type="button"
              onClick={markAllRead}
              disabled={saving}
              className="portal-button portal-button-secondary disabled:opacity-60"
            >
              <Icon name="check" className="size-4" />
              {saving ? "Atualizando..." : "Marcar esta página como lida"}
            </button>
          ) : undefined
        }
      />
      {error ? (
        <p role="alert" className="mb-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      <div className="border border-[var(--inat-line)] bg-white">
        <div className="flex border-b border-[var(--inat-line)]">
          {(["Não lidos", "Todos"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`relative min-h-11 px-5 text-sm font-semibold ${filter === item ? "text-[var(--inat-teal-dark)]" : "text-[var(--inat-muted)]"}`}
            >
              {item}
              {filter === item ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[var(--inat-clay)]" /> : null}
            </button>
          ))}
        </div>
        {pagination ? <p className="px-4 py-2 text-xs text-[var(--inat-muted)]">Os filtros se aplicam aos avisos desta página.</p> : null}
        {visible.length ? (
          <div className="divide-y divide-[var(--inat-line)]">
            {visible.map((notice) => (
              <article
                key={notice.id}
                className={`grid gap-4 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-start sm:p-5 ${notice.readAt ? "bg-white" : "bg-[var(--inat-mist)]/32"}`}
              >
                <span className={`mt-1 size-2 ${notice.readAt ? "bg-[var(--inat-line-strong)]" : "bg-[var(--inat-clay)]"}`} aria-label={notice.readAt ? "Lido" : "Não lido"} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={`text-sm ${notice.readAt ? "font-medium" : "font-semibold"}`}>{notice.title}</h2>
                    <StatusMark tone={["HIGH", "URGENT"].includes(notice.priority) ? "danger" : "neutral"}>{apiLabel(notice.priority)}</StatusMark>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--inat-muted)]">{notice.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[0.625rem] text-[var(--inat-muted)]">{formatDateTime(notice.createdAt)}</span>
                    {notice.contextType ? <span className="text-[0.6875rem] font-semibold text-[var(--inat-teal-dark)]">{notice.contextType}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  {!notice.readAt ? (
                    <button type="button" onClick={() => markRead(notice.id)} className="portal-button portal-button-quiet h-9">
                      Marcar como lido
                    </button>
                  ) : null}
                  {notice.actionUrl ? (
                    <Link href={safeActionUrl(notice.actionUrl)} onClick={() => !notice.readAt && markRead(notice.id)} className="portal-button portal-button-secondary h-9">
                      Abrir
                      <Icon name="arrow-right" className="size-4" />
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid size-11 place-items-center bg-emerald-50 text-emerald-700"><Icon name="check" className="size-5" /></span>
              <h2 className="mt-4 font-semibold">{notices.length ? "Tudo em dia" : "Nenhum aviso recebido"}</h2>
              <p className="mt-2 text-sm text-[var(--inat-muted)]">{notices.length ? "Não há avisos não lidos nesta página." : "Sua caixa será preenchida quando o backend criar uma notificação para você."}</p>
              {notices.length ? <button type="button" onClick={() => setFilter("Todos")} className="portal-button portal-button-secondary mt-5">Ver avisos anteriores</button> : null}
            </div>
          </div>
        )}
        {pagination ? <ListPagination shown={visible.length} {...pagination} /> : null}
      </div>
    </>
  );
}
