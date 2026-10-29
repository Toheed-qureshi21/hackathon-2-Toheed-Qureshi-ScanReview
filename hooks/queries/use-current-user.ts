"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiClientError } from "@/lib/api/api-error";
import { getAuthMe } from "@/lib/api/auth";
import { queryKeys } from "@/hooks/queries/query-keys";

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getAuthMe,
    staleTime: 60_000,
    refetchOnMount: "always",
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
