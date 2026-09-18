"use client";

import { FormEvent, useState } from "react";
import { ContactTypeSelect } from "@/components/landing/ContactTypeSelect";
import { ApiRequestError, postJson } from "@/lib/api/client";
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
      phone: String(fields.get("phone") ?? "").trim() || null,
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
      className="scroll-mt-44 bg-[var(--inat-bg)] py-20 sm:py-24"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="card-simple scroll-reveal p-6 sm:p-8" data-reveal="left">
          <p className="section-eyebrow">Fale conosco</p>
          <h2 className="section-title mt-3 text-3xl font-bold sm:text-4xl">
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
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={30}
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

        <aside className="scroll-reveal rounded-lg bg-[var(--inat-primary)] p-6 text-white shadow-[0_20px_60px_-46px_rgba(32,52,54,0.75)] sm:p-8" data-reveal="right">
          <h3 className="text-2xl font-bold">Dados institucionais</h3>
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
                {CONTACT_INFO.phone}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
                E-mail
              </dt>
              <dd className="mt-2 text-base text-white/80">
                {CONTACT_INFO.email}
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
        </aside>
      </div>
    </section>
  );
}
