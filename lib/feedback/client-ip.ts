/**
 * Client IP for public rate limiting.
 * Vercel is a trusted reverse proxy and sets `x-forwarded-for`.
 * Only the first hop is used. Untrusted extra headers are ignored.
 */
export function getPublicClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return "unknown";
}
