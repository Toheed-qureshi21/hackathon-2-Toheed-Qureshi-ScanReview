import { PublicTokenReviewPage } from "@/components/feedback/public-token-review-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Your review draft | ScanReview",
  description: "Turn your rating into an editable review draft.",
};

function ReviewFallback() {
  return <p className="hint wrap guest-main">Loading…</p>;
}

export default function GuestReviewHandoffPage() {
  return (
    <Suspense fallback={<ReviewFallback />}>
      <PublicTokenReviewPage />
    </Suspense>
  );
}
