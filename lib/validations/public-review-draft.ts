import { z } from "zod";

import { REVIEW_HIGHLIGHT_KEYS } from "@/lib/feedback/demo-review-draft";
import { publicSpotQuerySchema } from "@/lib/validations/public-feedback";

export const PUBLIC_REVIEW_DRAFT_MAX_JSON_BYTES = 4096;
export const REVIEW_DRAFT_COMMENT_MAX_LENGTH = 300;

export const createPublicReviewDraftBodySchema = publicSpotQuerySchema.extend({
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(REVIEW_DRAFT_COMMENT_MAX_LENGTH)
    .optional()
    .nullable(),
  highlights: z
    .array(z.enum(REVIEW_HIGHLIGHT_KEYS))
    .max(REVIEW_HIGHLIGHT_KEYS.length)
    .optional(),
});

export type CreatePublicReviewDraftBody = z.infer<
  typeof createPublicReviewDraftBodySchema
>;
