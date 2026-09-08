import { type NextRequest } from "next/server";
import { authRequestHeaders, backendFetch } from "@/lib/api/backend";
import {
  backendFailureResponse,
  readBackendSession,
  serviceUnavailableResponse,
  sessionApiResponse,
} from "@/lib/api/proxy-response";

export async function POST(request: NextRequest) {
  try {
    const backendResponse = await backendFetch("/api/auth/challenge/verify", {
      method: "POST",
      headers: authRequestHeaders(request),
      body: await request.text(),
    });
    const session = await readBackendSession(backendResponse);

    return session.ok
      ? sessionApiResponse(request, session)
      : backendFailureResponse(session);
  } catch {
    return serviceUnavailableResponse();
  }
}
