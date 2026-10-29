import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getPublicClientIp } from "@/lib/feedback/client-ip";
import {
  assertPublicReviewDraftRateLimit,
  PublicReviewDraftRateLimitError,
} from "@/lib/feedback/public-draft-rate-limit";
import {
  createPublicReviewDraft,
  PublicReviewDraftUnavailableError,
} from "@/lib/services/public-review-draft";
import { PublicSpotNotFoundError } from "@/lib/services/public-spot";
import {
  createPublicReviewDraftBodySchema,
  PUBLIC_REVIEW_DRAFT_MAX_JSON_BYTES,
} from "@/lib/validations/public-review-draft";

const UNAVAILABLE_MESSAGE = "Could not write a draft right now. Try again.";

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    Number(contentLength) > PUBLIC_REVIEW_DRAFT_MAX_JSON_BYTES
  ) {
    return jsonError("PAYLOAD_TOO_LARGE", "That request is too large.", 413);
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > PUBLIC_REVIEW_DRAFT_MAX_JSON_BYTES) {
      return jsonError("PAYLOAD_TOO_LARGE", "That request is too large.", 413);
    }
    body = JSON.parse(raw) as unknown;
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = createPublicReviewDraftBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Please check the submitted fields.",
      422,
      { issues: parsed.error.flatten() },
    );
  }

  try {
    assertPublicReviewDraftRateLimit(
      parsed.data.token,
      getPublicClientIp(request),
    );
    const data = await createPublicReviewDraft(parsed.data);
    return jsonSuccess(data);
  } catch (error) {
    if (error instanceof PublicReviewDraftRateLimitError) {
      return jsonError(
        "RATE_LIMITED",
        "Too many drafts from this link. Try again in a few minutes.",
        429,
      );
    }
    if (error instanceof PublicSpotNotFoundError) {
      return jsonError("NOT_FOUND", "This feedback link isn’t valid.", 404);
    }
    if (error instanceof PublicReviewDraftUnavailableError) {
      return jsonError("UNAVAILABLE", UNAVAILABLE_MESSAGE, 503);
    }
    return jsonError("INTERNAL_ERROR", UNAVAILABLE_MESSAGE, 500);
  }
}
