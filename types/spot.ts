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

export type CreatedSpotItem = SpotListItem & {
  qrStoragePath: string;
  qrImageUrl: string;
};

export type CreateSpotResponse = {
  organization: {
    id: string;
    name: string;
    spotLabel: string;
  };
  spot: CreatedSpotItem;
};
