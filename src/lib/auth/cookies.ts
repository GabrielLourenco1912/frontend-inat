export const ACCESS_TOKEN_COOKIE = "inat_access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

function configuredSecureCookie() {
  const configured = process.env.FRONTEND_AUTH_COOKIE_SECURE?.trim().toLowerCase();

  if (configured === "true") return true;
  if (configured === "false") return false;
  return null;
}

export function shouldUseSecureCookie(request: Request) {
  const configured = configuredSecureCookie();
  if (configured !== null) return configured;

  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim();

  return forwardedProtocol
    ? forwardedProtocol === "https"
    : new URL(request.url).protocol === "https:";
}

export function accessTokenCookieOptions(request: Request, expiresAt: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookie(request),
    path: "/",
    expires: new Date(expiresAt),
  };
}

export function expiredAccessTokenCookieOptions(request: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge: 0,
  };
}
