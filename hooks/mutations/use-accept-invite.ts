"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/query-keys";
import { getAuthMe } from "@/lib/api/auth";
import { postAcceptInvite } from "@/lib/api/invites";

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postAcceptInvite({}),
    onSuccess: async () => {
      const me = await getAuthMe();
      queryClient.setQueryData(queryKeys.auth.me, me);
    },
  });
}
