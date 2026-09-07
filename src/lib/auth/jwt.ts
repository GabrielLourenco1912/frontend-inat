import { Buffer } from "node:buffer";

type JwtPayload = {
  exp?: number;
  sub?: string;
};

export function readJwtPayload(token: string): JwtPayload | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }
}

export function getJwtSubject(token: string) {
  const subject = readJwtPayload(token)?.sub;
  return typeof subject === "string" && subject.length > 0 ? subject : null;
}

export function isAccessTokenUsable(token: string, clockSkewSeconds = 15) {
  const expiration = readJwtPayload(token)?.exp;
  return (
    typeof expiration === "number" &&
    expiration > Math.floor(Date.now() / 1000) + clockSkewSeconds
  );
}
