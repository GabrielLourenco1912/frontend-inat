"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { authErrorMessage, postJson } from "@/lib/api/client";
import type {
  AuthChallengeResponse,
  SessionTokenResponse,
} from "@/lib/api/contracts";

type AuthChallengeFormProps = {
  challenge: AuthChallengeResponse;
  returnTo: string;
  onBack?: () => void;
};

function expirationLabel(value: string) {
  const expiration = new Date(value);
  if (Number.isNaN(expiration.getTime())) return "por poucos minutos";

  return `até ${new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(expiration)}`;
}

export function AuthChallengeForm({
  challenge,
  returnTo,
  onBack,
}: AuthChallengeFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const verifyingEmail = challenge.purpose === "EMAIL_VERIFICATION";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("Informe os seis dígitos enviados por e-mail.");
      return;
    }

    setSubmitting(true);
    try {
      await postJson<SessionTokenResponse>("/api/auth/challenge/verify", {
        challengeId: challenge.challengeId,
        code,
      });
      router.replace(returnTo);
      router.refresh();
    } catch (requestError) {
      setError(
        authErrorMessage(
          requestError,
          "Não foi possível validar o código. Confira os dígitos e tente novamente.",
        ),
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <span className="border border-[var(--inat-teal)]/35 bg-[var(--inat-mist)] px-2 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-teal-dark)]">
        {verifyingEmail ? "Confirmação de e-mail" : "Verificação em duas etapas"}
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-[var(--inat-ink)]">
        Digite o código recebido
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--inat-muted)]">
        Enviamos um código de seis dígitos para <strong>{challenge.maskedEmail}</strong>. Ele é
        válido {expirationLabel(challenge.expiresAt)}.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 grid gap-5" noValidate>
        {error ? (
          <div
            className="flex gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800"
            role="alert"
          >
            <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div>
          <label htmlFor="auth-code" className="portal-label">
            Código de acesso
          </label>
          <input
            id="auth-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="portal-field mt-2 h-14 w-full px-4 text-center font-mono text-2xl tracking-[0.35em]"
            aria-describedby="auth-code-help"
            autoFocus
            required
          />
          <p id="auth-code-help" className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">
            Você possui até {challenge.maxAttempts} tentativas. O código só pode ser usado uma vez.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="portal-button portal-button-clay h-12 w-full disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Validando código..." : "Confirmar e entrar"}
          <Icon name="arrow-right" className="size-4" />
        </button>
      </form>

      <div className="mt-7 border-t border-[var(--inat-line)] pt-5 text-sm text-[var(--inat-muted)]">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="font-semibold text-[var(--inat-teal-dark)] hover:underline"
          >
            Voltar e informar outro e-mail
          </button>
        ) : (
          <>
            O código expirou?{" "}
            <Link
              href="/entrar"
              className="font-semibold text-[var(--inat-teal-dark)] hover:underline"
            >
              Entre com sua senha para receber outro
            </Link>
          </>
        )}
      </div>
    </>
  );
}
