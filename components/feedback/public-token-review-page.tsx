"use client";

import { GuestFeedbackInvalid } from "@/components/feedback/guest-feedback-invalid";
import { GuestReviewHandoff } from "@/components/feedback/guest-review-handoff";
import { usePublicSpot } from "@/hooks/queries/use-public-spot";
import type { GuestFeedbackContext } from "@/lib/mocks/guest-feedback";
import { useParams, useSearchParams } from "next/navigation";

export function PublicTokenReviewPage() {
  const params = useParams<{ orgId: string; spotId: string }>();
  const searchParams = useSearchParams();
  const organizationId = decodeURIComponent(params.orgId ?? "");
  const token = decodeURIComponent(params.spotId ?? "");
  const rating = Number(searchParams.get("rating"));
  const note = searchParams.get("note")?.trim();

  const { data, isLoading, isError } = usePublicSpot({
    organizationId,
    token,
  });

  if (
    !Number.isFinite(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return (
      <GuestFeedbackInvalid
        title="Review link isn’t ready"
        message="Choose a star rating on the feedback screen to continue."
      />
    );
  }

  if (isLoading) {
    return (
      <p className="hint wrap guest-main" role="status">
        Loading…
      </p>
    );
  }

  if (isError || !data) {
    return (
      <GuestFeedbackInvalid
        title="This feedback link isn’t valid"
        message="This QR code may be incomplete or no longer in use. Ask staff for a current code."
      />
    );
  }

  const context: GuestFeedbackContext = {
    demo: false,
    orgId: organizationId,
    orgName: data.organizationName,
    spotId: token,
    spotLabel: data.spotDisplayName.replace(/\s+\d+$/, "") || data.spotDisplayName,
    spotNumber: 0,
    spotDisplayName: data.spotDisplayName,
    reviewUrl: data.publicReviewUrl ?? "",
  };

  return (
    <GuestReviewHandoff context={context} rating={rating} note={note} />
  );
}
