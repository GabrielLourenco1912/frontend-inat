import { type NextRequest } from "next/server";
import { authRequestHeaders, backendFetch } from "@/lib/api/backend";
import {
  forwardBackendResponse,
  serviceUnavailableResponse,
} from "@/lib/api/proxy-response";

export async function POST(request: NextRequest) {
  try {
    const response = await backendFetch("/api/auth/register", {
      method: "POST",
      headers: authRequestHeaders(request),
      body: await request.text(),
    });
    return forwardBackendResponse(response);
  } catch {
    return serviceUnavailableResponse();
  }
}
