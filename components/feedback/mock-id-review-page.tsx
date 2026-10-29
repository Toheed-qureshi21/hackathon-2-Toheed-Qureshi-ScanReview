"use client";

import { GuestFeedbackInvalid } from "@/components/feedback/guest-feedback-invalid";
import { GuestReviewHandoff } from "@/components/feedback/guest-review-handoff";
import { getGuestContextByMockIds } from "@/lib/mocks/guest-feedback";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function MockIdReviewPage() {
  const params = useParams<{ orgId: string; spotId: string }>();
  const searchParams = useSearchParams();

  const parsed = useMemo(() => {
    const orgId = decodeURIComponent(params.orgId ?? "");
    const spotId = decodeURIComponent(params.spotId ?? "");
    const context = getGuestContextByMockIds(orgId, spotId);
    const record: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      record[key] = value;
    });
    const rating = Number(record.rating);
    const note = record.note?.trim();
    return { context, rating, note };
  }, [params.orgId, params.spotId, searchParams]);

  if (
    !parsed.context ||
    !Number.isFinite(parsed.rating) ||
    parsed.rating < 3 ||
    parsed.rating > 5
  ) {
    return (
      <GuestFeedbackInvalid
        title="Review link isn’t ready"
        message="Choose 3–5 stars on the feedback screen to open this demo handoff."
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
