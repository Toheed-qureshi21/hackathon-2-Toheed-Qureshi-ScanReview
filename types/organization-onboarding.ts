export type OnboardingSpotDto = {
  id: string;
  number: number;
  displayName: string;
  publicToken: string;
  publicFeedbackPath: string;
  publicFeedbackUrl: string;
};

export type CreateOrganizationResponse = {
  organization: {
    id: string;
    name: string;
    businessType: string;
    spotLabel: string;
    publicReviewUrl: string | null;
  };
  membership: {
    id: string;
    role: "ADMIN";
  };
  spots: OnboardingSpotDto[];
  managerInvite: {
    requested: boolean;
    sent: false;
    notice: string;
  };
};
