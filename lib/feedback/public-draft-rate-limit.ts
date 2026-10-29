/**
 * Process-local rate limits for public Gemini review drafts.
 *
 * Limits: ~5 POSTs per public token / 10 minutes, ~15 POSTs per IP / 10 minutes.
 * This is not shared across Vercel serverless isolates. Production-grade
 * enforcement needs a shared store (not added in Phase 7).
 */

const TOKEN_LIMIT = 5;
const IP_LIMIT = 15;
const WINDOW_MS = 10 * 60 * 1000;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export class PublicReviewDraftRateLimitError extends Error {
  readonly name = "PublicReviewDraftRateLimitError";
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

export function assertPublicReviewDraftRateLimit(
  token: string,
  ip: string,
  now = Date.now(),
): void {
  prune(now);
  const tokenOk = consume(`draft-token:${token}`, TOKEN_LIMIT, now);
  const ipOk = consume(`draft-ip:${ip}`, IP_LIMIT, now);
  if (!tokenOk || !ipOk) {
    throw new PublicReviewDraftRateLimitError();
  }
}

/** Test helper — not used in production routes. */
export function resetPublicReviewDraftRateLimitForTests(): void {
  buckets.clear();
}

export const PUBLIC_REVIEW_DRAFT_RATE_LIMIT = {
  tokenLimit: TOKEN_LIMIT,
  ipLimit: IP_LIMIT,
  windowMs: WINDOW_MS,
} as const;
