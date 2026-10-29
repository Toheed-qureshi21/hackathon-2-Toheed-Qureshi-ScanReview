export type SpotListItem = {
  id: string;
  number: number;
  displayName: string;
  publicToken: string;
  publicFeedbackPath: string;
  publicFeedbackUrl: string;
  qrStoragePath: string | null;
  qrImageUrl: string | null;
};

export type SpotsListResponse = {
  organization: {
    id: string;
    name: string;
    spotLabel: string;
  };
  spots: SpotListItem[];
};
