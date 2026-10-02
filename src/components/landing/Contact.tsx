"use client";

import { FormEvent, useState } from "react";
import { ContactTypeSelect } from "@/components/landing/ContactTypeSelect";
import { Icon } from "@/components/design-system/Icon";
import { MaskedInput } from "@/components/design-system/MaskedInput";
import { ApiRequestError, postJson } from "@/lib/api/client";
import { phoneDigits } from "@/lib/inputs/masks";
import type {
  ContactMessage,
  ContactMessageType,
} from "@/lib/api/domain-contracts";
import { CONTACT_INFO, INSTITUTION_ADDRESS } from "@/lib/constants";

export function Contact() {
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [selectKey, setSelectKey] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const body = {
      name: String(fields.get("name") ?? "").trim(),
      email: String(fields.get("email") ?? "").trim(),
      phone: phoneDigits(String(fields.get("phone") ?? "")) || null,
      contactType: String(fields.get("contactType")) as ContactMessageType,
      message: String(fields.get("message") ?? "").trim(),
    };

    setSending(true);
    setFeedback(null);
    try {
      await postJson<ContactMessage>("/api/contact-messages", body);
      form.reset();
      setSelectKey((current) => current + 1);
      setFeedback({
        tone: "success",
        message: "Mensagem enviada. A equipe do INAT entrará em contato.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof ApiRequestError && error.status === 400
            ? "Revise os campos informados e tente novamente."
            : "Não foi possível enviar sua mensagem. Tente novamente em instantes.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      id="contato"
      className="scroll-mt-24 bg-[var(--inat-paper)] py-20 sm:py-28"
    >
      <div className="mx-auto grid w-full max-w-[90rem] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-8">
        <div className="card-simple scroll-reveal p-6 sm:p-8 lg:p-10" data-reveal="left">
          <p className="section-eyebrow">Fale conosco</p>
          <h2 className="section-title mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
            Envie uma mensagem para o INAT
          </h2>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-[var(--inat-primary)]"
                >
                  Nome
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  maxLength={150}
                  autoComplete="name"
                  className="field mt-2 w-full px-4"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-[var(--inat-primary)]"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  className="field mt-2 w-full px-4"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="phone"
                  className="text-sm font-semibold text-[var(--inat-primary)]"
                >
                  Telefone/WhatsApp
                </label>
                <MaskedInput
                  id="phone"
                  name="phone"
                  mask="phone"
                  autoComplete="tel"
                  className="field mt-2 w-full px-4"
                />
              </div>
              <div>
                <label
                  htmlFor="contactType"
                  id="contactTypeLabel"
                  className="text-sm font-semibold text-[var(--inat-primary)]"
                >
                  Tipo de contato
                </label>
                <ContactTypeSelect key={selectKey} />
              </div>
            </div>

            <div>
              <label
                htmlFor="message"
                className="text-sm font-semibold text-[var(--inat-primary)]"
              >
                Mensagem
              </label>
              <textarea
                id="message"
                name="message"
                required
                maxLength={5000}
                rows={6}
                className="field mt-2 w-full px-4 py-3"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              aria-busy={sending}
              className="btn-base btn-primary w-full sm:w-fit"
            >
              {sending ? "Enviando..." : "Enviar mensagem"}
            </button>

            {feedback ? (
              <p
                className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                  feedback.tone === "success"
                    ? "bg-[rgba(8,130,133,0.1)] text-[var(--inat-primary)]"
                    : "bg-rose-50 text-rose-800"
                }`}
                role={feedback.tone === "error" ? "alert" : "status"}
              >
                {feedback.message}
              </p>
            ) : null}
          </form>
        </div>

        <aside className="scroll-reveal flex flex-col rounded-lg bg-[var(--inat-ink)] p-6 text-white shadow-[0_20px_60px_-46px_rgba(32,52,54,0.75)] [--inat-focus-ring:var(--inat-paper)] sm:p-8 lg:p-10" data-reveal="right">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#78cbc7]">Contatos e horários</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">Dados institucionais</h3>
          <dl className="mt-8 grid gap-6">
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
                Endereço
              </dt>
              <dd className="mt-2 text-base leading-7 text-white/80">
                {INSTITUTION_ADDRESS}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
                Telefone/WhatsApp
              </dt>
              <dd className="mt-2 text-base text-white/80">
                <a href={CONTACT_INFO.phoneHref} className="hover:text-white hover:underline">
                  {CONTACT_INFO.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
                E-mail
              </dt>
              <dd className="mt-2 text-base text-white/80">
                <a href={`mailto:${CONTACT_INFO.email}`} className="break-all hover:text-white hover:underline">
                  {CONTACT_INFO.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
                Horário de atendimento
              </dt>
              <dd className="mt-2 text-base text-white/80">
                {CONTACT_INFO.hours}
              </dd>
            </div>
          </dl>
          <div className="mt-auto pt-8">
            <div className="border-t border-white/15 pt-6">
              <a
                href={CONTACT_INFO.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-base w-full gap-2 border border-white/25 bg-white/5 text-white hover:bg-white/10 sm:w-fit"
              >
                Conversar no WhatsApp
                <Icon name="arrow-right" className="size-4" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
