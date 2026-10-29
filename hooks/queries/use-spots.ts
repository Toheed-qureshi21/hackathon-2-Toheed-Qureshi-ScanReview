"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiClientError } from "@/lib/api/api-error";
import { getSpots } from "@/lib/api/spots";
import { queryKeys } from "@/hooks/queries/query-keys";

type UseSpotsOptions = {
  search?: string;
  enabled?: boolean;
};

export function useSpots({ search, enabled = true }: UseSpotsOptions = {}) {
  const trimmedSearch = search?.trim() || undefined;

  return useQuery({
    queryKey: queryKeys.spots.list(
      trimmedSearch ? { search: trimmedSearch } : undefined,
    ),
    queryFn: () => getSpots(trimmedSearch),
    enabled,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
