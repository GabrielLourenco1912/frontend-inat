import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { can, type Capability } from "@/domain/auth";
import { backendFetch } from "@/lib/api/backend";
import type { ApiResponse, CurrentUserContextResponse } from "@/lib/api/contracts";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { getJwtSubject } from "@/lib/auth/jwt";
import { mapUserToActor } from "@/lib/auth/user-mapper";

const resolveActor = cache(async (accessToken: string) => {
  const subject = getJwtSubject(accessToken);
  if (!subject) return null;

  const response = await backendFetch("/api/me", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if ([401, 403, 404].includes(response.status)) return null;
  if (!response.ok) {
    throw new Error(`Unable to load authenticated user (${response.status})`);
  }

  const envelope = (await response.json()) as ApiResponse<CurrentUserContextResponse>;
  if (!envelope.data) return null;
  const actor = mapUserToActor(envelope.data.user, envelope.data);
  return actor.isActive ? actor : null;
});

export async function getCurrentActor() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  return accessToken ? resolveActor(accessToken) : null;
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
