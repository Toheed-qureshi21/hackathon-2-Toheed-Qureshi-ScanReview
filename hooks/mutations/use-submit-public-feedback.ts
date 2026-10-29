"use client";

import { useMutation } from "@tanstack/react-query";

import { postPublicFeedback } from "@/lib/api/public-feedback";
import type { CreatePublicFeedbackBody } from "@/lib/validations/public-feedback";

export function useSubmitPublicFeedback() {
  return useMutation({
    mutationFn: (body: CreatePublicFeedbackBody) => postPublicFeedback(body),
  });
}
