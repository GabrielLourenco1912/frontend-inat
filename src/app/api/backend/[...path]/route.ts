import { NextResponse, type NextRequest } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const responseHeaders = [
  "content-type",
  "content-disposition",
  "cache-control",
] as const;

function unauthorized() {
  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      status: "UNAUTHORIZED",
      message: "Authentication required",
      data: null,
    },
    { status: 401 },
  );
}

async function proxyDomainRequest(request: NextRequest, context: RouteContext) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return unauthorized();

  const { path } = await context.params;
  if (!path.length || path[0] === "auth") {
    return NextResponse.json({ message: "Resource not found" }, { status: 404 });
  }

  const method = request.method.toUpperCase();
  if (method === "POST" && path.length === 1 && path[0] === "users") {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: "METHOD_NOT_ALLOWED",
        message: "Direct user creation is not exposed by the frontend",
        data: null,
      },
      { status: 405, headers: { Allow: "GET" } },
    );
  }

  const headers = new Headers({
    Accept: request.headers.get("accept") ?? "application/json",
    Authorization: `Bearer ${accessToken}`,
  });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const forwardedFor =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (forwardedFor) headers.set("X-Forwarded-For", forwardedFor);

  const hasBody = !["GET", "HEAD"].includes(method);

  try {
    const backendResponse = await backendFetch(
      `/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      {
        method,
        headers,
        body: hasBody ? await request.arrayBuffer() : undefined,
      },
    );
    const outgoingHeaders = new Headers();
    for (const name of responseHeaders) {
      const value = backendResponse.headers.get(name);
      if (value) outgoingHeaders.set(name, value);
    }

    return new NextResponse(await backendResponse.arrayBuffer(), {
      status: backendResponse.status,
      headers: outgoingHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: "SERVICE_UNAVAILABLE",
        message: "Backend service is unavailable",
        data: null,
      },
      { status: 503 },
    );
  }
}

export const GET = proxyDomainRequest;
export const POST = proxyDomainRequest;
export const PUT = proxyDomainRequest;
export const PATCH = proxyDomainRequest;
export const DELETE = proxyDomainRequest;
