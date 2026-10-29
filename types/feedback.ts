export type DashboardFeedbackItem = {
  id: string;
  rating: number;
  createdAt: string;
  spotDisplayName: string;
  spotLabel: string;
  comment: string | null;
};

export type FeedbackListResponse = {
  items: DashboardFeedbackItem[];
  nextCursor: string | null;
};
