import "server-only";

import { redirect } from "next/navigation";
import { can, type Capability } from "@/domain/auth";
import { mockActor } from "@/mocks/backend-adapter";

export async function getCurrentActor() {
  return mockActor;
}

export async function requireActor() {
  const actor = await getCurrentActor();
  if (!actor) {
    redirect("/api/auth/session-refresh?returnTo=%2Fsistema");
  }
  return actor;
}

export async function requireCapability(capability: Capability) {
  const actor = await requireActor();
  if (!can(actor, capability)) {
    redirect("/sistema/sem-acesso");
  }
  return actor;
}
