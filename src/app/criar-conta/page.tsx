import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { getCurrentActor } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Criar conta | Portal INAT",
  description: "Criação de conta para acesso ao portal do INAT Paranaguá.",
};

export default async function SignupPage() {
  const actor = await getCurrentActor();
  if (actor) redirect("/sistema");
  const regulationUrl = process.env.REGULATION_URL?.trim() || null;

  return (
    <AuthShell>
      <SignupForm regulationUrl={regulationUrl} />
    </AuthShell>
  );
}
