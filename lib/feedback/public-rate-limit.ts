/**
 * Process-local rate limits for public feedback.
 *
 * Limits: ~10 POSTs per public token / 10 minutes, ~30 POSTs per IP / 10 minutes.
 * This is not shared across Vercel serverless isolates. Production-grade
 * enforcement needs a shared store (not added in Phase 5).
 */

const TOKEN_LIMIT = 10;
const IP_LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export class PublicFeedbackRateLimitError extends Error {
  readonly name = "PublicFeedbackRateLimitError";
}

function prune(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function consume(key: string, limit: number, now: number): boolean {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (existing.count >= limit) {
    return false;
  }
  existing.count += 1;
  return true;
}

export function assertPublicFeedbackRateLimit(
  token: string,
  ip: string,
  now = Date.now(),
): void {
  prune(now);
  const tokenOk = consume(`token:${token}`, TOKEN_LIMIT, now);
  const ipOk = consume(`ip:${ip}`, IP_LIMIT, now);
  if (!tokenOk || !ipOk) {
    throw new PublicFeedbackRateLimitError();
  }
}

/** Test helper — not used in production routes. */
export function resetPublicFeedbackRateLimitForTests(): void {
  buckets.clear();
}

export const PUBLIC_FEEDBACK_RATE_LIMIT = {
  tokenLimit: TOKEN_LIMIT,
  ipLimit: IP_LIMIT,
  windowMs: WINDOW_MS,
} as const;
