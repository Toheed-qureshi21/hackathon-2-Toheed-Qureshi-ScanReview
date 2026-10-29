import "server-only";

import { generateGeminiReviewDraft } from "@/lib/ai/gemini";
import { logReviewDraftOutcome } from "@/lib/ai/gemini-call";
import {
  buildReviewDraftPrompt,
  uniqueHighlights,
} from "@/lib/ai/review-draft-content";
import { emptyToNull } from "@/lib/validations/public-feedback";
import type { CreatePublicReviewDraftBody } from "@/lib/validations/public-review-draft";
import { resolvePublicSpot } from "@/lib/services/public-spot";
import type { PublicReviewDraftDto } from "@/types/public-feedback";

export class PublicReviewDraftUnavailableError extends Error {
  readonly name = "PublicReviewDraftUnavailableError";
  readonly status:
    | "unconfigured"
    | "timeout"
    | "failed"
    | "malformed"
    | "model_unavailable";

  constructor(status: PublicReviewDraftUnavailableError["status"]) {
    super("Unable to write a review draft right now.");
    this.status = status;
  }
}

export async function createPublicReviewDraft(
  body: CreatePublicReviewDraftBody,
): Promise<PublicReviewDraftDto> {
  const spot = await resolvePublicSpot({
    token: body.token,
    organizationId: body.organizationId,
  });

  const prompt = buildReviewDraftPrompt({
    organizationName: spot.organizationName,
    spotDisplayName: spot.spotDisplayName,
    rating: body.rating,
    comment: emptyToNull(body.comment),
    highlights: uniqueHighlights(body.highlights),
  });

  const result = await generateGeminiReviewDraft({
    systemInstruction: prompt.systemInstruction,
    userText: prompt.userText,
  });

  if (!result.ok) {
    logReviewDraftOutcome({ status: result.reason });
    throw new PublicReviewDraftUnavailableError(result.reason);
  }

  logReviewDraftOutcome({ status: "ok" });
  return { draft: result.text };
}
