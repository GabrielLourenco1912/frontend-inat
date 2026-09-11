"use client";

import { PaginatedContent } from "@/components/design-system/ClientPagination";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, SectionHeading, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import { patchJson, requestErrorMessage } from "@/lib/api/client";
import type { NotificationRecipient } from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime } from "@/lib/api/format";

export function DeliveryFailures({ recipients, userNames }: { recipients: NotificationRecipient[]; userNames: Record<string, string> }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function retry(recipient: NotificationRecipient) {
    setBusyId(recipient.id);
    setError("");
    try {
      await patchJson<NotificationRecipient>(`/api/backend/notification-recipients/${encodeURIComponent(recipient.id)}/delivery`, { deliveryStatus: "PENDING", failureReason: null });
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível reenfileirar a entrega."));
    } finally {
      setBusyId("");
    }
  }

  return <Sheet className="mt-5"><SectionHeading title="Falhas de entrega" description="Entregas de e-mail com falha podem voltar à fila do agendador." icon="alert" />{error ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}{recipients.length ? <div className="divide-y divide-[var(--inat-line)]"><PaginatedContent>{recipients.map((recipient) => <div key={recipient.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"><div><p className="text-sm font-semibold">{recipient.title}</p><p className="mt-1 text-xs text-[var(--inat-muted)]">{userNames[recipient.recipientUserId] ?? recipient.recipientUserId} · {apiLabel(recipient.channel)} · {formatDateTime(recipient.updatedAt)}</p><p className="mt-2 text-xs text-rose-700">{recipient.failureReason || "Falha sem motivo registrado"}</p></div><div className="flex items-center gap-2"><StatusMark tone="danger">Falha</StatusMark><button type="button" onClick={() => retry(recipient)} disabled={busyId === recipient.id} className="portal-button portal-button-secondary h-9">{busyId === recipient.id ? "Reenfileirando..." : "Tentar novamente"}</button></div></div>)}</PaginatedContent></div> : <EmptyState title="Nenhuma falha" description="Não há entregas com falha no momento." icon="check" />}</Sheet>;
}
