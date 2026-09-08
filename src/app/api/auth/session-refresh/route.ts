import { NextResponse, type NextRequest } from "next/server";
import { authRequestHeaders, backendFetch } from "@/lib/api/backend";
import {
  attachSessionCookies,
  clearSessionCookies,
  readBackendSession,
} from "@/lib/api/proxy-response";
import { safeReturnTo } from "@/lib/auth/return-to";

function loginRedirect(request: NextRequest, returnTo: string) {
  const destination = new URL("/entrar", request.url);
  destination.searchParams.set("returnTo", returnTo);
  destination.searchParams.set("session", "expired");
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  let invalidSession = false;

  try {
    const backendResponse = await backendFetch("/api/auth/refresh", {
      method: "POST",
      headers: authRequestHeaders(request, {
        includeRefreshCookie: true,
        hasJsonBody: false,
      }),
    });
    const session = await readBackendSession(backendResponse);

    if (session.ok) {
      const response = NextResponse.redirect(new URL(returnTo, request.url));
      attachSessionCookies(request, response, session);
      return response;
    }
    invalidSession = [400, 401, 403].includes(session.status);
  } catch {
    // The redirect below gives the user a recoverable authentication path.
  }

  const response = loginRedirect(request, returnTo);
  if (invalidSession) clearSessionCookies(request, response);
  return response;
}
