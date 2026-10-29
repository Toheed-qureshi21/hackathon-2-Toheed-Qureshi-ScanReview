import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getPublicClientIp } from "@/lib/feedback/client-ip";
import {
  assertPublicFeedbackRateLimit,
  PublicFeedbackRateLimitError,
} from "@/lib/feedback/public-rate-limit";
import {
  createPublicFeedback,
  PublicFeedbackValidationError,
} from "@/lib/services/public-feedback";
import { PublicSpotNotFoundError } from "@/lib/services/public-spot";
import {
  createPublicFeedbackBodySchema,
  PUBLIC_FEEDBACK_MAX_JSON_BYTES,
} from "@/lib/validations/public-feedback";

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    Number(contentLength) > PUBLIC_FEEDBACK_MAX_JSON_BYTES
  ) {
    return jsonError(
      "PAYLOAD_TOO_LARGE",
      "That request is too large.",
      413,
    );
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > PUBLIC_FEEDBACK_MAX_JSON_BYTES) {
      return jsonError(
        "PAYLOAD_TOO_LARGE",
        "That request is too large.",
        413,
      );
    }
    body = JSON.parse(raw) as unknown;
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = createPublicFeedbackBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Please check the submitted fields.",
      422,
      { issues: parsed.error.flatten() },
    );
  }

  try {
    assertPublicFeedbackRateLimit(
      parsed.data.token,
      getPublicClientIp(request),
    );
    const data = await createPublicFeedback(parsed.data);
    return jsonSuccess(data, 201);
  } catch (error) {
    if (error instanceof PublicFeedbackRateLimitError) {
      return jsonError(
        "RATE_LIMITED",
        "Too many ratings from this link. Try again in a few minutes.",
        429,
      );
    }
    if (error instanceof PublicSpotNotFoundError) {
      return jsonError("NOT_FOUND", "This feedback link isn’t valid.", 404);
    }
    if (error instanceof PublicFeedbackValidationError) {
      return jsonError("VALIDATION_ERROR", error.message, 422);
    }
    return jsonError(
      "INTERNAL_ERROR",
      "Unable to save your rating right now.",
      500,
    );
  }
}
