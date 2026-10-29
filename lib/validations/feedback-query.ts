import { z } from "zod";

import { decodeFeedbackCursor } from "@/lib/feedback/feedback-cursor";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const FEEDBACK_LIST_DEFAULT_LIMIT = 50;
export const FEEDBACK_LIST_MAX_LIMIT = 50;
export const FEEDBACK_SEARCH_MAX_LENGTH = 80;

export const listFeedbackQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(FEEDBACK_SEARCH_MAX_LENGTH)
    .optional()
    .transform((value) => (value ? value : undefined)),
  limit: z
    .string()
    .optional()
    .transform((raw, ctx) => {
      if (raw === undefined || raw.trim() === "") {
        return FEEDBACK_LIST_DEFAULT_LIMIT;
      }
      const trimmed = raw.trim();
      if (!/^\d+$/.test(trimmed)) {
        ctx.addIssue({ code: "custom", message: "Invalid limit." });
        return z.NEVER;
      }
      return Number(trimmed);
    })
    .pipe(z.number().int().min(1).max(FEEDBACK_LIST_MAX_LIMIT)),
  cursor: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .optional()
    .refine((value) => value === undefined || decodeFeedbackCursor(value) !== null, {
      message: "Invalid cursor.",
    }),
  organizationId: z.string().trim().regex(UUID_RE).optional(),
});

export type ListFeedbackQueryInput = z.infer<typeof listFeedbackQuerySchema>;

export type ListFeedbackQuery = Pick<
  ListFeedbackQueryInput,
  "search" | "limit" | "cursor"
>;

export function listFeedbackQueryFromSearchParams(searchParams: URLSearchParams) {
  return listFeedbackQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    organizationId: searchParams.get("organizationId") ?? undefined,
  });
}
