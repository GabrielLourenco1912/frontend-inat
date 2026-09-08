import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/shell/PortalShell";
import { requireActor } from "@/lib/auth/session";
import { serverApiGet } from "@/lib/api/server";

export const metadata: Metadata = {
  title: {
    default: "Portal INAT",
    template: "%s | Portal INAT",
  },
  description: "Portal acadêmico e administrativo do INAT Paranaguá.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SystemLayout({ children }: { children: ReactNode }) {
  const actor = await requireActor();
  const unread = await serverApiGet<{ count: number }>("/api/notification-recipients/me/unread-count");
  return <PortalShell actor={actor} unreadCount={unread.count}>{children}</PortalShell>;
}
