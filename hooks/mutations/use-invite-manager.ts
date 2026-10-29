"use client";

import { useMutation } from "@tanstack/react-query";

import { postInviteManager } from "@/lib/api/invites";

export function useInviteManager() {
  return useMutation({
    mutationFn: (body: { managerName: string; managerEmail: string }) =>
      postInviteManager(body),
  });
}
