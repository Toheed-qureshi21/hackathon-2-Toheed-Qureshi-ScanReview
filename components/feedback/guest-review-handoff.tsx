"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { GuestFeedbackHeader } from "@/components/feedback/guest-feedback-header";
import { buildGuestFeedbackHref } from "@/lib/feedback/guest-review-navigation";
import type { GuestFeedbackContext } from "@/lib/mocks/guest-feedback";

type GuestReviewHandoffProps = {
  context: GuestFeedbackContext;
  rating: number;
  note?: string;
};

export function GuestReviewHandoff({
  context,
  rating,
  note,
}: GuestReviewHandoffProps) {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  return (
    <>
      <GuestFeedbackHeader />
      <main className="wrap guest-main">
        <div className="guest-review-meta">
          <span className="pill">
            {context.orgName} · {context.spotDisplayName}
          </span>
          <span className="guest-review-stars" role="img" aria-label={`${rating} out of 5 stars`}>
            {stars}
          </span>
        </div>
        <div className="card guest-card">
          <h1>Turn your visit into a review</h1>
          <p className="hint guest-lead">
            Phase 7 will add the full AI review drafter here. Your rating was
            carried from the feedback step (demo flow).
          </p>
          {note ? (
            <p className="hint">
              <strong>Note from guest (demo):</strong> {note}
            </p>
          ) : null}
          <p className="hint guest-demo-tag">
            No AI call · no draft generated · UI handoff only
          </p>
          <div className="acts">
            <ButtonLink href={buildGuestFeedbackHref(context)}>
              Change rating
            </ButtonLink>
            <Link className="btn gh" href="/">
              Done
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
