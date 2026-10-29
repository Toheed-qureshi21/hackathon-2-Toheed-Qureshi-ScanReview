import { DemoFeedbackPage } from "@/components/feedback/demo-feedback-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "How was your visit? | ScanReview",
  description: "Share quick guest feedback — demo UI, no sign-up.",
};

function FeedbackFallback() {
  return <p className="hint wrap guest-main">Loading…</p>;
}

export default function DemoGuestFeedbackPage() {
  return (
    <Suspense fallback={<FeedbackFallback />}>
      <DemoFeedbackPage />
    </Suspense>
  );
}
