export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  organization: {
    current: ["organization", "current"] as const,
  },
  spots: {
    list: (organizationId?: string) =>
      ["spots", { organizationId: organizationId ?? "current" }] as const,
  },
  feedback: {
    list: (filters?: Record<string, unknown>) =>
      ["feedback", { filters: filters ?? {} }] as const,
    detail: (feedbackId: string) => ["feedback", feedbackId] as const,
  },
} as const;
