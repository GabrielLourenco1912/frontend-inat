import "server-only";

import type { NextRequest } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";

function backendBaseUrl() {
  return (process.env.BACKEND_URL?.trim() || "http://localhost:8080").replace(
    /\/+$/,
    "",
  );
}

export function backendFetch(path: string, init: RequestInit = {}) {
  return fetch(`${backendBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(15_000),
  });
}

export function authRequestHeaders(
  request: NextRequest,
  options: { includeRefreshCookie?: boolean; hasJsonBody?: boolean } = {},
) {
  const headers = new Headers({
    Accept: "application/json",
    "X-Client-Type": "web",
  });

  if (options.hasJsonBody !== false) {
    headers.set("Content-Type", "application/json");
  }

  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("User-Agent", userAgent);

  const forwardedFor =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (forwardedFor) headers.set("X-Forwarded-For", forwardedFor);

  if (options.includeRefreshCookie) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (refreshToken) {
      headers.set("Cookie", `${REFRESH_TOKEN_COOKIE}=${refreshToken}`);
    }
  }

  return headers;
}
