import { randomBytes } from "node:crypto";

const TOKEN_BYTES = 24;

/** URL-safe opaque public spot token (not a sequential id). */
export function generatePublicSpotToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function isValidPublicSpotTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]{16,64}$/.test(token);
}
