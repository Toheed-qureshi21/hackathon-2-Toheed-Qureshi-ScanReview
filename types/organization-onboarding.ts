export type OnboardingSpotDto = {
  id: string;
  number: number;
  displayName: string;
  publicToken: string;
  publicFeedbackPath: string;
  publicFeedbackUrl: string;
  /** Storage object path in bucket `scanreview-qr-codes`. */
  qrStoragePath: string;
  /** Public Supabase Storage URL derived from `qrStoragePath`. */
  qrImageUrl: string;
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
    sent: boolean;
    email: string | null;
    notice: string;
  };
};
