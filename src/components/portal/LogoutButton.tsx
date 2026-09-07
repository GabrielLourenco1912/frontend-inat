"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/design-system/Icon";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} disabled={loading} className="portal-button portal-button-secondary text-rose-700 disabled:opacity-60">
      <Icon name="logout" className="size-4" />
      {loading ? "Encerrando..." : "Sair do sistema"}
    </button>
  );
}
