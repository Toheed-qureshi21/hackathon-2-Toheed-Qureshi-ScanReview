import { DemoReviewPage } from "@/components/feedback/demo-review-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Your review draft | ScanReview",
  description: "AI review drafter demo — local templates, no sign-up.",
};

function ReviewFallback() {
  return <p className="hint wrap guest-main">Loading…</p>;
}

export default function DemoGuestReviewPage() {
  return (
    <Suspense fallback={<ReviewFallback />}>
      <DemoReviewPage />
    </Suspense>
  );
}
