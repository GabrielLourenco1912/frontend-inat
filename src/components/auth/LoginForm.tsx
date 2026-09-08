"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthChallengeForm } from "@/components/auth/AuthChallengeForm";
import { Icon } from "@/components/design-system/Icon";
import { authErrorMessage, postJson } from "@/lib/api/client";
import type { AuthChallengeResponse } from "@/lib/api/contracts";

export function LoginForm({
  returnTo,
  sessionExpired = false,
}: {
  returnTo: string;
  sessionExpired?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<AuthChallengeResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Informe seu e-mail e sua senha.");
      return;
    }

    setSubmitting(true);
    try {
      const nextChallenge = await postJson<AuthChallengeResponse>("/api/auth/login", {
        email: email.trim(),
        password,
      });
      setChallenge(nextChallenge);
      setPassword("");
    } catch (requestError) {
      setError(authErrorMessage(requestError, "Não foi possível iniciar o acesso."));
    } finally {
      setSubmitting(false);
    }
  }

  if (challenge) {
    return (
      <AuthChallengeForm
        challenge={challenge}
        returnTo={returnTo}
        onBack={() => {
          setChallenge(null);
          setError("");
        }}
      />
    );
  }

  return (
    <>
      <span className="border border-[var(--inat-teal)]/35 bg-[var(--inat-mist)] px-2 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-teal-dark)]">
        Acesso seguro
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-[var(--inat-ink)]">
        Acesse seu espaço no INAT
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--inat-muted)]">
        Depois da senha, enviaremos um código temporário ao seu e-mail para confirmar o acesso.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 grid gap-5" noValidate>
        {sessionExpired ? (
          <div className="flex gap-3 border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900" role="status">
            <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
            Sua sessão terminou. Entre novamente para continuar.
          </div>
        ) : null}
        {error ? (
          <div className="flex gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800" role="alert">
            <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div>
          <label htmlFor="login-email" className="portal-label">
            E-mail
          </label>
          <div className="relative mt-2">
            <Icon name="mail" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]" />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="portal-field h-12 w-full pl-10 pr-4"
              maxLength={254}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="portal-label">
            Senha
          </label>
          <div className="relative mt-2">
            <Icon name="lock" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="portal-field h-12 w-full pl-10 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-1 top-1 grid size-10 place-items-center text-[var(--inat-muted)] hover:text-[var(--inat-ink)]"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              <Icon name="eye" className="size-4" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="portal-button portal-button-clay h-12 w-full disabled:cursor-wait disabled:opacity-65"
        >
          {submitting ? "Validando credenciais..." : "Continuar"}
          <Icon name="arrow-right" className="size-4" />
        </button>
      </form>

      <div className="mt-7 border-t border-[var(--inat-line)] pt-5 text-sm text-[var(--inat-muted)]">
        Ainda não possui uma conta?{" "}
        <Link href="/criar-conta" className="font-semibold text-[var(--inat-teal-dark)] hover:underline">
          Criar conta
        </Link>
      </div>
    </>
  );
}
