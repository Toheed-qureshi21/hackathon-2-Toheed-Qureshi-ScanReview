import { PublicTokenFeedbackPage } from "@/components/feedback/public-token-feedback-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "How was your visit? | ScanReview",
  description: "Share quick guest feedback — no sign-up.",
};

function FeedbackFallback() {
  return <p className="hint wrap guest-main">Loading…</p>;
}

export default function GuestFeedbackPage() {
  return (
    <Suspense fallback={<FeedbackFallback />}>
      <PublicTokenFeedbackPage />
    </Suspense>
  );
}
