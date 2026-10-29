"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/query-keys";
import { ApiClientError } from "@/lib/api/api-error";
import { getPublicSpot } from "@/lib/api/public-feedback";

export function usePublicSpot(input: {
  organizationId: string;
  token: string;
  enabled?: boolean;
}) {
  const enabled =
    (input.enabled ?? true) &&
    Boolean(input.organizationId) &&
    Boolean(input.token);

  return useQuery({
    queryKey: queryKeys.publicSpot(input.organizationId, input.token),
    queryFn: () =>
      getPublicSpot({
        organizationId: input.organizationId,
        token: input.token,
      }),
    enabled,
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
