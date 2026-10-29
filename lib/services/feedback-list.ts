import "server-only";

import { prisma } from "@/lib/db/prisma";
import { decodeFeedbackCursor } from "@/lib/feedback/feedback-cursor";
import {
  toDashboardFeedbackItem,
  type FeedbackListRow,
} from "@/lib/feedback/feedback-list-dto";
import { paginateFeedbackRows } from "@/lib/feedback/feedback-list-page";
import {
  DASHBOARD_FEEDBACK_ORG_SELECT,
  DASHBOARD_FEEDBACK_SELECT,
  buildFeedbackListWhere,
} from "@/lib/feedback/feedback-list-query";
import type { ListFeedbackQuery } from "@/lib/validations/feedback-query";
import type { FeedbackListResponse } from "@/types/feedback";

export async function listFeedbackForOrganization(
  organizationId: string,
  query: ListFeedbackQuery,
): Promise<FeedbackListResponse> {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: DASHBOARD_FEEDBACK_ORG_SELECT,
  });

  const cursor = query.cursor ? decodeFeedbackCursor(query.cursor) : null;

  const rows: FeedbackListRow[] = await prisma.feedback.findMany({
    where: buildFeedbackListWhere(organizationId, {
      search: query.search,
      cursor,
    }),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    select: DASHBOARD_FEEDBACK_SELECT,
  });

  const { page, nextCursor } = paginateFeedbackRows(rows, query.limit);

  return {
    items: page.map((row) =>
      toDashboardFeedbackItem(row, organization.spotLabel),
    ),
    nextCursor,
  };
}
