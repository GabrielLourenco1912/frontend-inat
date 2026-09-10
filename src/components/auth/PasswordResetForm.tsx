"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { authErrorMessage, postJson } from "@/lib/api/client";
import type { AuthChallengeResponse } from "@/lib/api/contracts";

function expirationLabel(value: string) {
  const expiration = new Date(value);
  if (Number.isNaN(expiration.getTime())) return "por poucos minutos";

  return `até ${new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(expiration)}`;
}

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [challenge, setChallenge] = useState<AuthChallengeResponse | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Informe o e-mail da sua conta.");
      return;
    }

    setSubmitting(true);
    try {
      const nextChallenge = await postJson<AuthChallengeResponse>(
        "/api/auth/forgot-password",
        { email: normalizedEmail },
      );
      if (nextChallenge.purpose !== "PASSWORD_RESET") {
        throw new Error("Unexpected authentication challenge purpose");
      }
      setEmail(normalizedEmail);
      setChallenge(nextChallenge);
    } catch (requestError) {
      setError(
        authErrorMessage(
          requestError,
          "Não foi possível enviar o código de recuperação.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!challenge) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Informe os seis dígitos enviados por e-mail.");
      return;
    }
    if (newPassword.length < 8) {
      setError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("A nova senha não pode ultrapassar 72 bytes.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("A confirmação não corresponde à nova senha.");
      return;
    }

    setSubmitting(true);
    try {
      await postJson<null>("/api/auth/reset-password", {
        challengeId: challenge.challengeId,
        code,
        newPassword,
      });
      setCode("");
      setNewPassword("");
      setConfirmation("");
      setComplete(true);
    } catch (requestError) {
      setError(
        authErrorMessage(
          requestError,
          "Não foi possível redefinir sua senha.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) {
    return (
      <>
        <span className="border border-emerald-300 bg-emerald-50 px-2 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-emerald-800">
          Senha atualizada
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-[var(--inat-ink)]">
          Sua nova senha já está valendo
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--inat-muted)]">
          Por segurança, suas sessões anteriores foram encerradas. Entre novamente usando a nova senha e conclua a verificação em duas etapas.
        </p>
        <Link
          href="/entrar"
          className="portal-button portal-button-clay mt-7 h-12 w-full"
        >
          Ir para o acesso
          <Icon name="arrow-right" className="size-4" />
        </Link>
      </>
    );
  }

  if (!challenge) {
    return (
      <>
        <span className="border border-[var(--inat-teal)]/35 bg-[var(--inat-mist)] px-2 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-teal-dark)]">
          Recuperação de acesso
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-[var(--inat-ink)]">
          Esqueceu sua senha?
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--inat-muted)]">
          Informe o e-mail da sua conta. Enviaremos um código temporário para você definir uma nova senha.
        </p>

        <form onSubmit={requestCode} className="mt-7 grid gap-5" noValidate>
          {error ? (
            <div className="flex gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800" role="alert">
              <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          ) : null}
          <div>
            <label htmlFor="password-reset-email" className="portal-label">
              E-mail
            </label>
            <div className="relative mt-2">
              <Icon name="mail" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]" />
              <input
                id="password-reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="portal-field h-12 w-full pl-10 pr-4"
                maxLength={254}
                autoFocus
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="portal-button portal-button-clay h-12 w-full disabled:cursor-wait disabled:opacity-65"
          >
            {submitting ? "Enviando código..." : "Enviar código"}
            <Icon name="arrow-right" className="size-4" />
          </button>
        </form>

        <div className="mt-7 border-t border-[var(--inat-line)] pt-5 text-sm text-[var(--inat-muted)]">
          Lembrou sua senha?{" "}
          <Link href="/entrar" className="font-semibold text-[var(--inat-teal-dark)] hover:underline">
            Voltar ao acesso
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <span className="border border-[var(--inat-teal)]/35 bg-[var(--inat-mist)] px-2 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-teal-dark)]">
        Redefinição de senha
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-[var(--inat-ink)]">
        Digite o código e a nova senha
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--inat-muted)]">
        Enviamos o código para <strong>{challenge.maskedEmail}</strong>. Ele é válido {expirationLabel(challenge.expiresAt)}.
      </p>

      <form onSubmit={resetPassword} className="mt-7 grid gap-5" noValidate>
        {error ? (
          <div className="flex gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800" role="alert">
            <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : null}
        <div>
          <label htmlFor="password-reset-code" className="portal-label">
            Código de recuperação
          </label>
          <input
            id="password-reset-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="portal-field mt-2 h-14 w-full px-4 text-center font-mono text-2xl tracking-[0.35em]"
            aria-describedby="password-reset-code-help"
            autoFocus
            required
          />
          <p id="password-reset-code-help" className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">
            Você possui até {challenge.maxAttempts} tentativas. O código só pode ser usado uma vez.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="new-password" className="portal-label">
              Nova senha
            </label>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="portal-field mt-2 h-12 w-full px-4"
              minLength={8}
              required
            />
          </div>
          <div>
            <label htmlFor="new-password-confirmation" className="portal-label">
              Confirmar senha
            </label>
            <input
              id="new-password-confirmation"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="portal-field mt-2 h-12 w-full px-4"
              minLength={8}
              required
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--inat-muted)]">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
            className="size-4 accent-[var(--inat-teal)]"
          />
          Mostrar a nova senha
        </label>
        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="portal-button portal-button-clay h-12 w-full disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Atualizando senha..." : "Redefinir senha"}
          <Icon name="arrow-right" className="size-4" />
        </button>
      </form>

      <div className="mt-7 border-t border-[var(--inat-line)] pt-5 text-sm text-[var(--inat-muted)]">
        <button
          type="button"
          onClick={() => {
            setChallenge(null);
            setCode("");
            setNewPassword("");
            setConfirmation("");
            setError("");
          }}
          className="font-semibold text-[var(--inat-teal-dark)] hover:underline"
        >
          Voltar e informar outro e-mail
        </button>
      </div>
    </>
  );
}
