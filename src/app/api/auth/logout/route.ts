import { NextResponse, type NextRequest } from "next/server";
import { authRequestHeaders, backendFetch } from "@/lib/api/backend";
import {
  clearSessionCookies,
  forwardBackendResponse,
} from "@/lib/api/proxy-response";

export async function POST(request: NextRequest) {
  let response: NextResponse;

  try {
    const backendResponse = await backendFetch("/api/auth/logout", {
      method: "POST",
      headers: authRequestHeaders(request, {
        includeRefreshCookie: true,
        hasJsonBody: false,
      }),
    });
    response = await forwardBackendResponse(backendResponse);
  } catch {
    response = NextResponse.json({ ok: true });
  }

  clearSessionCookies(request, response);
  return response;
}
