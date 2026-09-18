"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/design-system/Icon";
import {
  DefinitionList,
  PageHeader,
  Sheet,
  StatusMark,
} from "@/components/design-system/PortalPrimitives";
import { deleteResource, patchJson, requestErrorMessage } from "@/lib/api/client";
import type {
  ContactMessage,
  ContactMessageStatus,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime } from "@/lib/api/format";

export function ContactMessageDetails({
  initialMessage,
}: {
  initialMessage: ContactMessage;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(status: ContactMessageStatus) {
    setBusy(true);
    setError("");
    try {
      const updated = await patchJson<ContactMessage>(
        `/api/backend/contact-messages/${encodeURIComponent(message.id)}/status`,
        { status },
      );
      setMessage(updated);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível atualizar a mensagem."));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Excluir esta mensagem de contato permanentemente?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteResource(
        `/api/backend/contact-messages/${encodeURIComponent(message.id)}`,
      );
      router.replace("/sistema/administracao/mensagens");
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível excluir a mensagem."));
      setBusy(false);
    }
  }

  const replySubject = encodeURIComponent("Retorno do INAT Paranaguá");
  const phoneHref = message.phone
    ? `tel:${message.phone.replace(/[^\d+]/g, "")}`
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Mensagem de contato"
        title={message.name}
        description={`Recebida em ${formatDateTime(message.createdAt)}`}
        backHref="/sistema/administracao/mensagens"
        backLabel="Voltar para mensagens"
        action={<StatusMark>{apiLabel(message.status)}</StatusMark>}
      />

      {error ? (
        <p role="alert" className="mb-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Sheet>
          <div className="border-b border-[var(--inat-line)] px-4 py-4 sm:px-5">
            <h2 className="font-semibold text-[var(--inat-ink)]">Mensagem</h2>
          </div>
          <p className="whitespace-pre-wrap break-words px-4 py-5 text-sm leading-7 text-[var(--inat-ink)] sm:px-5">
            {message.message}
          </p>
        </Sheet>

        <div className="grid content-start gap-5">
          <Sheet>
            <DefinitionList
              columns={1}
              items={[
                { label: "Nome", value: message.name },
                {
                  label: "E-mail",
                  value: <a className="text-[var(--inat-teal-dark)] underline-offset-2 hover:underline" href={`mailto:${message.email}?subject=${replySubject}`}>{message.email}</a>,
                },
                {
                  label: "Telefone/WhatsApp",
                  value: phoneHref ? <a className="text-[var(--inat-teal-dark)] underline-offset-2 hover:underline" href={phoneHref}>{message.phone}</a> : "Não informado",
                },
                { label: "Tipo de contato", value: apiLabel(message.contactType) },
              ]}
            />
          </Sheet>

          <Sheet className="p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-[var(--inat-ink)]">Ações</h2>
            <div className="mt-4 grid gap-2">
              <a
                href={`mailto:${message.email}?subject=${replySubject}`}
                className="portal-button portal-button-primary justify-center"
              >
                <Icon name="mail" className="size-4" />
                Responder por e-mail
              </a>
              {message.status === "NEW" ? (
                <button type="button" disabled={busy} onClick={() => updateStatus("READ")} className="portal-button portal-button-secondary justify-center">
                  <Icon name="check" className="size-4" /> Marcar como lida
                </button>
              ) : null}
              {message.status !== "ARCHIVED" ? (
                <button type="button" disabled={busy} onClick={() => updateStatus("ARCHIVED")} className="portal-button portal-button-secondary justify-center">
                  <Icon name="folder" className="size-4" /> Arquivar
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => updateStatus("READ")} className="portal-button portal-button-secondary justify-center">
                  <Icon name="mail" className="size-4" /> Restaurar como lida
                </button>
              )}
              <button type="button" disabled={busy} onClick={remove} className="portal-button portal-button-quiet justify-center text-rose-700">
                <Icon name="trash" className="size-4" /> Excluir mensagem
              </button>
            </div>
          </Sheet>
        </div>
      </div>
    </>
  );
}
