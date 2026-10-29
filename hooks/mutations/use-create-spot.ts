"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/query-keys";
import { appendCreatedSpotToList } from "@/lib/dashboard/add-spot-action";
import { postCreateSpot } from "@/lib/api/spots";
import type { SpotsListResponse } from "@/types/spot";

export function useCreateSpot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postCreateSpot(),
    onSuccess: (created) => {
      queryClient.setQueriesData<SpotsListResponse>(
        { queryKey: queryKeys.spots.all },
        (current) =>
          current ? appendCreatedSpotToList(current, created) : current,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.spots.all });
    },
  });
}
