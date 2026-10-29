import { apiGet } from "@/lib/api/client";
import type { FeedbackListResponse } from "@/types/feedback";

export type FeedbackListClientQuery = {
  search?: string;
};

export function buildFeedbackListPath(
  query: FeedbackListClientQuery = {},
): string {
  const params = new URLSearchParams();
  const search = query.search?.trim();
  if (search) {
    params.set("search", search);
  }
  const qs = params.toString();
  return qs ? `/feedback?${qs}` : "/feedback";
}

export async function getFeedbackList(
  query: FeedbackListClientQuery = {},
): Promise<FeedbackListResponse> {
  return apiGet<FeedbackListResponse>(buildFeedbackListPath(query));
}
