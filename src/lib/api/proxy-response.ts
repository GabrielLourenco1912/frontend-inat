import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import type {
  ApiResponse,
  BackendAccessTokenResponse,
  SessionTokenResponse,
} from "@/lib/api/contracts";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  expiredAccessTokenCookieOptions,
  shouldUseSecureCookie,
} from "@/lib/auth/cookies";

type BackendFailure = {
  ok: false;
  status: number;
  body: string;
  contentType: string;
  refreshCookie: string | null;
};

export type BackendSessionSuccess = {
  ok: true;
  envelope: ApiResponse<BackendAccessTokenResponse>;
  refreshCookie: string | null;
};

export type BackendSessionResult = BackendFailure | BackendSessionSuccess;

function contentType(response: Response) {
  return response.headers.get("content-type") ?? "application/json; charset=utf-8";
}

export async function forwardBackendResponse(response: Response) {
  const nextResponse = new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": contentType(response) },
  });
  const refreshCookie = response.headers.get("set-cookie");
  if (refreshCookie) nextResponse.headers.append("Set-Cookie", refreshCookie);
  return nextResponse;
}

export function serviceUnavailableResponse() {
  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      status: "SERVICE_UNAVAILABLE",
      message: "Authentication service is unavailable",
      data: null,
    },
    { status: 503 },
  );
}

export async function readBackendSession(
  response: Response,
): Promise<BackendSessionResult> {
  const body = await response.text();
  const refreshCookie = response.headers.get("set-cookie");

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body,
      contentType: contentType(response),
      refreshCookie,
    };
  }

  try {
    const envelope = JSON.parse(body) as ApiResponse<BackendAccessTokenResponse>;
    const token = envelope.data?.token;
    const expiresAt = envelope.data?.expiresAt;

    if (typeof token !== "string" || typeof expiresAt !== "string") {
      throw new Error("Missing access token");
    }

    return { ok: true, envelope, refreshCookie };
  } catch {
    return {
      ok: false,
      status: 502,
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        status: "BAD_GATEWAY",
        message: "Authentication service returned an invalid response",
        data: null,
      }),
      contentType: "application/json; charset=utf-8",
      refreshCookie,
    };
  }
}

export function backendFailureResponse(failure: BackendFailure) {
  const response = new NextResponse(failure.body, {
    status: failure.status,
    headers: { "Content-Type": failure.contentType },
  });
  if (failure.refreshCookie) {
    response.headers.append("Set-Cookie", failure.refreshCookie);
  }
  return response;
}

export function attachSessionCookies(
  request: NextRequest,
  response: NextResponse,
  session: BackendSessionSuccess,
) {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    session.envelope.data.token,
    accessTokenCookieOptions(request, session.envelope.data.expiresAt),
  );

  if (session.refreshCookie) {
    response.headers.append("Set-Cookie", session.refreshCookie);
  }
}

export function sessionApiResponse(
  request: NextRequest,
  session: BackendSessionSuccess,
) {
  const tokenData = session.envelope.data;
  const publicSession: SessionTokenResponse = {
    issuer: tokenData.issuer,
    issuedAt: tokenData.issuedAt,
    expiresAt: tokenData.expiresAt,
    subject: tokenData.subject,
    refreshTokenExpiresAt: tokenData.refreshTokenExpiresAt,
  };
  const envelope: ApiResponse<SessionTokenResponse> = {
    ...session.envelope,
    data: publicSession,
  };
  const response = NextResponse.json(envelope);
  attachSessionCookies(request, response, session);
  return response;
}

export function clearSessionCookies(request: NextRequest, response: NextResponse) {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    "",
    expiredAccessTokenCookieOptions(request),
  );
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/api/auth",
    maxAge: 0,
  });
}
