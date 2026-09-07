import { type NextRequest } from "next/server";
import { authRequestHeaders, backendFetch } from "@/lib/api/backend";
import {
  backendFailureResponse,
  clearSessionCookies,
  readBackendSession,
  serviceUnavailableResponse,
  sessionApiResponse,
} from "@/lib/api/proxy-response";

export async function POST(request: NextRequest) {
  try {
    const backendResponse = await backendFetch("/api/auth/refresh", {
      method: "POST",
      headers: authRequestHeaders(request, {
        includeRefreshCookie: true,
        hasJsonBody: false,
      }),
    });
    const session = await readBackendSession(backendResponse);

    if (session.ok) return sessionApiResponse(request, session);

    const response = backendFailureResponse(session);
    if ([400, 401, 403].includes(session.status)) {
      clearSessionCookies(request, response);
    }
    return response;
  } catch {
    return serviceUnavailableResponse();
  }
}
