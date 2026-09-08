import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/api/backend";
import type { ApiResponse, PageResponse } from "@/lib/api/contracts";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

export class ServerApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: unknown,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

export async function serverApiGet<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) redirect("/api/auth/session-refresh?returnTo=%2Fsistema");

  const response = await backendFetch(path, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const envelope = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (response.status === 401) {
    redirect("/api/auth/session-refresh?returnTo=%2Fsistema");
  }
  if (response.status === 403) redirect("/sistema/sem-acesso");
  if (!response.ok) {
    throw new ServerApiError(
      response.status,
      envelope?.message ?? "Backend request failed",
      envelope?.data ?? null,
    );
  }
  if (!envelope || !("data" in envelope)) {
    throw new ServerApiError(502, "Backend response is invalid", null);
  }

  return envelope.data;
}

export async function serverApiGetOrNull<T>(path: string) {
  try {
    return await serverApiGet<T>(path);
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) return null;
    throw error;
  }
}

export async function serverApiPage<T>(path: string) {
  return serverApiGet<PageResponse<T>>(path);
}

export async function serverApiAll<T>(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  const first = await serverApiPage<T>(`${path}${separator}page=0&size=100`);
  if (first.totalPages <= 1) return first.content;

  const remaining = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) =>
      serverApiPage<T>(
        `${path}${separator}page=${index + 1}&size=100`,
      ),
    ),
  );
  return [first, ...remaining].flatMap((page) => page.content);
}
