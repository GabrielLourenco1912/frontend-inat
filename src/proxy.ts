import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { isAccessTokenUsable } from "@/lib/auth/jwt";

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken && isAccessTokenUsable(accessToken)) {
    return NextResponse.next();
  }

  const refreshUrl = new URL("/api/auth/session-refresh", request.url);
  refreshUrl.searchParams.set(
    "returnTo",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(refreshUrl);
}

export const config = {
  matcher: ["/sistema/:path*"],
};
