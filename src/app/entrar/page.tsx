import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeReturnTo } from "@/lib/auth/return-to";
import { getCurrentActor } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Entrar | Portal INAT",
  description: "Acesso ao portal acadêmico e administrativo do INAT Paranaguá.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; session?: string }>;
}) {
  const [actor, params] = await Promise.all([getCurrentActor(), searchParams]);
  if (actor) redirect(safeReturnTo(params.returnTo));

  return (
    <AuthShell>
      <LoginForm
        returnTo={safeReturnTo(params.returnTo)}
        sessionExpired={params.session === "expired"}
      />
    </AuthShell>
  );
}
