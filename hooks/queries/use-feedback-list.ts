"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/query-keys";
import { ApiClientError } from "@/lib/api/api-error";
import { getFeedbackList } from "@/lib/api/feedback";

type UseFeedbackListOptions = {
  search?: string;
  enabled?: boolean;
};

export function useFeedbackList({
  search,
  enabled = true,
}: UseFeedbackListOptions = {}) {
  const trimmedSearch = search?.trim() || undefined;

  return useQuery({
    queryKey: queryKeys.feedback.list(
      trimmedSearch ? { search: trimmedSearch } : undefined,
    ),
    queryFn: () => getFeedbackList({ search: trimmedSearch }),
    enabled,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
