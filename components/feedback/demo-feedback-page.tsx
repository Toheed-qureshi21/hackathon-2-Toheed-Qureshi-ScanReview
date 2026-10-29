"use client";

import { GuestFeedbackExperience } from "@/components/feedback/guest-feedback-experience";
import { GuestFeedbackInvalid } from "@/components/feedback/guest-feedback-invalid";
import { getGuestContextFromDemoQuery } from "@/lib/mocks/guest-feedback";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function DemoFeedbackPage() {
  const searchParams = useSearchParams();

  const context = useMemo(() => {
    const record: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      record[key] = value;
    });
    return getGuestContextFromDemoQuery(record);
  }, [searchParams]);

  if (!context) {
    return <GuestFeedbackInvalid />;
  }

  return <GuestFeedbackExperience context={context} />;
}
