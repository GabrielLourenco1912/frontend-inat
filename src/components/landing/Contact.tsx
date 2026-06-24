"use client";

import { FormEvent, useState } from "react";
import { ContactTypeSelect } from "@/components/landing/ContactTypeSelect";
import { CONTACT_INFO, INSTITUTION_ADDRESS } from "@/lib/constants";

export function Contact() {
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: Integrate with an API route, EmailJS, Resend or another mail service.
    setStatus("Mensagem preparada para envio. Integração pendente.");
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
                <ContactTypeSelect />
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
                rows={6}
                className="field mt-2 w-full px-4 py-3"
              />
            </div>

            <button
              type="submit"
              className="btn-base btn-primary w-full sm:w-fit"
            >
              Enviar mensagem
            </button>

            {status ? (
              <p
                className="rounded-lg bg-[rgba(8,130,133,0.1)] px-4 py-3 text-sm font-semibold text-[var(--inat-primary)]"
                role="status"
              >
                {status}
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
