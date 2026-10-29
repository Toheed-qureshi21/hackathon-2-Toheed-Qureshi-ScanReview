import type { DashboardFeedbackItem } from "@/types/feedback";

export type FeedbackListRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  spot: { displayName: string };
};

export function toDashboardFeedbackItem(
  row: FeedbackListRow,
  spotLabel: string,
): DashboardFeedbackItem {
  return {
    id: row.id,
    rating: row.rating,
    createdAt: row.createdAt.toISOString(),
    spotDisplayName: row.spot.displayName,
    spotLabel,
    comment: row.comment,
  };
}

export function displayFeedbackComment(comment: string | null): string {
  const trimmed = comment?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "No comment left.";
}
