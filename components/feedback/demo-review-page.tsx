"use client";

import { GuestFeedbackInvalid } from "@/components/feedback/guest-feedback-invalid";
import { GuestReviewHandoff } from "@/components/feedback/guest-review-handoff";
import { getGuestContextFromDemoQuery } from "@/lib/mocks/guest-feedback";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function DemoReviewPage() {
  const searchParams = useSearchParams();

  const parsed = useMemo(() => {
    const record: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      record[key] = value;
    });
    const context = getGuestContextFromDemoQuery(record);
    const rating = Number(record.rating);
    const note = record.note?.trim();
    return { context, rating, note };
  }, [searchParams]);

  if (
    !parsed.context ||
    !Number.isFinite(parsed.rating) ||
    parsed.rating < 3 ||
    parsed.rating > 5
  ) {
    return (
      <GuestFeedbackInvalid
        title="Review link isn’t ready"
        message="Open a guest feedback link and choose 3–5 stars to preview the review handoff."
      />
    );
  }

  return (
    <GuestReviewHandoff
      context={parsed.context}
      rating={parsed.rating}
      note={parsed.note}
    />
  );
}
