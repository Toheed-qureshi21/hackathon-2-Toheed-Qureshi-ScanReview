export type PublicSpotDto = {
  organizationName: string;
  spotDisplayName: string;
  publicReviewUrl: string | null;
};

export type PublicFeedbackDto = {
  id: string;
  rating: number;
  createdAt: string;
};
