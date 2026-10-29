import { encodeFeedbackCursor } from "@/lib/feedback/feedback-cursor";

export function paginateFeedbackRows<T extends { createdAt: Date; id: string }>(
  rows: T[],
  limit: number,
): { page: T[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  return {
    page,
    nextCursor:
      hasMore && last ? encodeFeedbackCursor(last.createdAt, last.id) : null,
  };
}
