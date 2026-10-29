import type { FeedbackWhereInput } from "@/app/generated/prisma/models";

import type { FeedbackListCursor } from "@/lib/feedback/feedback-cursor";

/** Trusted fields only — never select contact details or tokens. */
export const DASHBOARD_FEEDBACK_SELECT = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  spot: {
    select: {
      displayName: true,
    },
  },
} as const;

export const DASHBOARD_FEEDBACK_ORG_SELECT = {
  spotLabel: true,
} as const;

export function buildFeedbackListWhere(
  organizationId: string,
  options: {
    search?: string;
    cursor?: FeedbackListCursor | null;
  } = {},
): FeedbackWhereInput {
  const and: FeedbackWhereInput[] = [];
  const search = options.search?.trim();

  if (search) {
    const or: FeedbackWhereInput[] = [
      { comment: { contains: search, mode: "insensitive" } },
      { spot: { displayName: { contains: search, mode: "insensitive" } } },
    ];
    if (/^[1-5]$/.test(search)) {
      or.push({ rating: Number(search) });
    }
    and.push({ OR: or });
  }

  if (options.cursor) {
    const { createdAt, id } = options.cursor;
    and.push({
      OR: [
        { createdAt: { lt: createdAt } },
        { AND: [{ createdAt }, { id: { lt: id } }] },
      ],
    });
  }

  if (and.length === 0) {
    return { organizationId };
  }

  return { organizationId, AND: and };
}
