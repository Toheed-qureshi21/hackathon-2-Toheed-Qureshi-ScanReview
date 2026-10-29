"use client";

import { useMutation } from "@tanstack/react-query";

import { postPublicReviewDraft } from "@/lib/api/public-feedback";
import type { CreatePublicReviewDraftBody } from "@/lib/validations/public-review-draft";

export function useGenerateReviewDraft() {
  return useMutation({
    mutationFn: (body: CreatePublicReviewDraftBody) =>
      postPublicReviewDraft(body),
  });
}
