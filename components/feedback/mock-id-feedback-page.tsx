"use client";

import { GuestFeedbackExperience } from "@/components/feedback/guest-feedback-experience";
import { GuestFeedbackInvalid } from "@/components/feedback/guest-feedback-invalid";
import { getGuestContextByMockIds } from "@/lib/mocks/guest-feedback";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export function MockIdFeedbackPage() {
  const params = useParams<{ orgId: string; spotId: string }>();

  const context = useMemo(() => {
    const orgId = decodeURIComponent(params.orgId ?? "");
    const spotId = decodeURIComponent(params.spotId ?? "");
    return getGuestContextByMockIds(orgId, spotId);
  }, [params.orgId, params.spotId]);

  if (!context) {
    return <GuestFeedbackInvalid />;
  }

  return <GuestFeedbackExperience context={context} />;
}
