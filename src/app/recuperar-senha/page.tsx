import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordResetForm } from "@/components/auth/PasswordResetForm";
import { getCurrentActor } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Recuperar senha | Portal INAT",
  description: "Recuperação da senha de acesso ao Portal INAT.",
};

export default async function PasswordResetPage() {
  const actor = await getCurrentActor();
  if (actor) redirect("/sistema");

  return (
    <AuthShell>
      <PasswordResetForm />
    </AuthShell>
  );
}
