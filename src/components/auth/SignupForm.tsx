"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthChallengeForm } from "@/components/auth/AuthChallengeForm";
import { Icon } from "@/components/design-system/Icon";
import { authErrorMessage, postJson } from "@/lib/api/client";
import type { AuthChallengeResponse } from "@/lib/api/contracts";
import { PUBLIC_DOCUMENTS } from "@/lib/constants";

export function SignupForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState<AuthChallengeResponse | null>(null);
  const [regulationOpen, setRegulationOpen] = useState(false);
  const [regulationAcceptedAt, setRegulationAcceptedAt] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (!name || !email) {
      setError("Informe seu nome completo e seu e-mail.");
      return;
    }
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("A confirmação não corresponde à senha informada.");
      return;
    }
    if (!regulationAcceptedAt) {
      setError("Leia e aceite o regulamento para criar a conta.");
      return;
    }

    setSubmitting(true);
    try {
      const nextChallenge = await postJson<AuthChallengeResponse>("/api/auth/register", {
        name,
        email,
        regulationAccepted: true,
        regulationAcceptedAt,
        password,
      });
      setChallenge(nextChallenge);
    } catch (requestError) {
      setError(authErrorMessage(requestError, "Não foi possível criar a conta."));
    } finally {
      setSubmitting(false);
    }
  }

  if (challenge) {
    return <AuthChallengeForm challenge={challenge} returnTo="/sistema" />;
  }

  return (
    <>
      <span className="border border-[var(--inat-teal)]/35 bg-[var(--inat-mist)] px-2 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-teal-dark)]">
        Cadastro de acesso
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-[var(--inat-ink)]">
        Crie sua conta
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--inat-muted)]">
        Use o mesmo e-mail de uma pessoa já cadastrada no INAT. Depois do envio,
        você confirmará o endereço com um código recebido por e-mail.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 grid gap-5" noValidate>
        {error ? (
          <div className="flex gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : null}
        <div>
          <label htmlFor="signup-name" className="portal-label">Nome completo</label>
          <input id="signup-name" name="name" className="portal-field mt-2 h-12 w-full px-4" autoComplete="name" maxLength={100} required />
        </div>
        <div>
          <label htmlFor="signup-email" className="portal-label">E-mail</label>
          <input id="signup-email" name="email" type="email" className="portal-field mt-2 h-12 w-full px-4" autoComplete="email" maxLength={254} required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="signup-password" className="portal-label">Senha</label>
            <input id="signup-password" name="password" type="password" className="portal-field mt-2 h-12 w-full px-4" autoComplete="new-password" minLength={8} required />
          </div>
          <div>
            <label htmlFor="signup-confirmation" className="portal-label">Confirmar senha</label>
            <input id="signup-confirmation" name="confirmation" type="password" className="portal-field mt-2 h-12 w-full px-4" autoComplete="new-password" minLength={8} required />
          </div>
        </div>
        <div className="border border-[var(--inat-line)] bg-[var(--inat-mist)]/45 p-4">
          <div className="flex items-start gap-3">
            <Icon name="document" className="mt-0.5 size-5 shrink-0 text-[var(--inat-teal-dark)]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--inat-ink)]">Regulamento Interno dos Aprendizes</p>
              <p className="mt-1 text-xs leading-5 text-[var(--inat-muted)]">
                O aceite registra a data e a hora em que você concordou com o documento oficial.
              </p>
              <button
                type="button"
                onClick={() => setRegulationOpen(true)}
                className="mt-3 text-xs font-semibold text-[var(--inat-teal-dark)] hover:underline"
              >
                Ler o regulamento completo
              </button>
            </div>
          </div>
        </div>
        <label className="flex items-start gap-3 text-xs leading-5 text-[var(--inat-muted)]">
          <input
            type="checkbox"
            checked={Boolean(regulationAcceptedAt)}
            onChange={(event) =>
              setRegulationAcceptedAt(event.target.checked ? new Date().toISOString() : null)
            }
            required
            className="mt-0.5 size-4 accent-[var(--inat-teal)]"
          />
          Li e aceito o Regulamento Interno dos Aprendizes.
        </label>
        <button type="submit" disabled={submitting || !regulationAcceptedAt} className="portal-button portal-button-clay h-12 w-full disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Criando conta..." : "Criar conta"}
          <Icon name="arrow-right" className="size-4" />
        </button>
      </form>

      <div className="mt-7 border-t border-[var(--inat-line)] pt-5 text-sm text-[var(--inat-muted)]">
        Já possui uma conta?{" "}
        <Link href="/entrar" className="font-semibold text-[var(--inat-teal-dark)] hover:underline">
          Acessar o portal
        </Link>
      </div>

      {regulationOpen ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="regulation-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setRegulationOpen(false);
          }}
        >
          <div className="flex h-[min(52rem,92svh)] w-full max-w-4xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--inat-line)] px-4 py-3 sm:px-5">
              <div>
                <p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-teal-dark)]">Documento oficial</p>
                <h2 id="regulation-title" className="mt-1 text-base font-semibold">Regulamento Interno dos Aprendizes</h2>
              </div>
              <button
                type="button"
                onClick={() => setRegulationOpen(false)}
                className="grid size-10 place-items-center text-[var(--inat-muted)] hover:bg-[var(--inat-mist)] hover:text-[var(--inat-ink)]"
                aria-label="Fechar regulamento"
              >
                <span aria-hidden="true" className="text-xl">×</span>
              </button>
            </div>
            <iframe
              src={PUBLIC_DOCUMENTS.regulation}
              title="Regulamento Interno dos Aprendizes"
              className="min-h-0 flex-1 border-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col gap-3 border-t border-[var(--inat-line)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <a
                href={PUBLIC_DOCUMENTS.regulation}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[var(--inat-teal-dark)] hover:underline"
              >
                Abrir documento em outra guia
              </a>
              <button
                type="button"
                onClick={() => setRegulationOpen(false)}
                className="portal-button portal-button-primary"
              >
                Voltar ao cadastro
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
