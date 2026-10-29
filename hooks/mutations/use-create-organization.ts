"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/query-keys";
import { postCreateOrganization } from "@/lib/api/organizations";
import type { CreateOrganizationBody } from "@/lib/validations/onboarding";

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateOrganizationBody) => postCreateOrganization(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}
