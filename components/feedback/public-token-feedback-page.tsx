"use client";

import { GuestFeedbackExperience } from "@/components/feedback/guest-feedback-experience";
import { GuestFeedbackInvalid } from "@/components/feedback/guest-feedback-invalid";
import { usePublicSpot } from "@/hooks/queries/use-public-spot";
import { ApiClientError } from "@/lib/api/api-error";
import type { GuestFeedbackContext } from "@/lib/mocks/guest-feedback";
import { useParams } from "next/navigation";

export function PublicTokenFeedbackPage() {
  const params = useParams<{ orgId: string; spotId: string }>();
  const organizationId = decodeURIComponent(params.orgId ?? "");
  const token = decodeURIComponent(params.spotId ?? "");

  const { data, isLoading, isError, error } = usePublicSpot({
    organizationId,
    token,
  });

  if (isLoading) {
    return (
      <p className="hint wrap guest-main" role="status">
        Loading…
      </p>
    );
  }

  if (isError || !data) {
    const notFound =
      error instanceof ApiClientError && error.status === 404;
    return (
      <GuestFeedbackInvalid
        title="This feedback link isn’t valid"
        message={
          notFound
            ? "This QR code may be incomplete or no longer in use. Ask staff for a current code."
            : "We couldn’t load this page. Check your connection and try again."
        }
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
    <GuestFeedbackExperience
      context={context}
      organizationId={organizationId}
      token={token}
    />
  );
}
