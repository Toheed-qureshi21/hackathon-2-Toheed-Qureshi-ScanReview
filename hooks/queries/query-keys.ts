export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  organization: {
    current: ["organization", "current"] as const,
  },
  spots: {
    list: (filters?: { search?: string }) =>
      ["spots", "list", filters ?? {}] as const,
  },
  feedback: {
    list: (filters?: { search?: string }) =>
      ["feedback", "list", filters ?? {}] as const,
    detail: (feedbackId: string) => ["feedback", feedbackId] as const,
  },
  publicSpot: (organizationId: string, token: string) =>
    ["public", "spot", { organizationId, token }] as const,
} as const;
