import { MockIdReviewPage } from "@/components/feedback/mock-id-review-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Your review draft | ScanReview",
  description: "Review drafter handoff (demo UI).",
};

function ReviewFallback() {
  return <p className="hint wrap guest-main">Loading…</p>;
}

export default function GuestReviewHandoffPage() {
  return (
    <Suspense fallback={<ReviewFallback />}>
      <MockIdReviewPage />
    </Suspense>
  );
}
