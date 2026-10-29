"use client";

import { FeedbackStarRating } from "@/components/feedback/feedback-star-rating";
import { GuestFeedbackHeader } from "@/components/feedback/guest-feedback-header";
import { Button } from "@/components/ui/button";
import { buildGuestReviewHref } from "@/lib/feedback/guest-review-navigation";
import type { GuestFeedbackContext } from "@/lib/mocks/guest-feedback";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const EMAIL_OR_PHONE =
  /^(\S+@\S+\.\S+|[+]?[\d\s().-]{7,})$/;

type GuestFeedbackExperienceProps = {
  context: GuestFeedbackContext;
};

function orgDisplayName(orgName: string) {
  const trimmed = orgName.trim();
  return trimmed.length > 0 ? trimmed : "our restaurant";
}

export function GuestFeedbackExperience({
  context,
}: GuestFeedbackExperienceProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [contactError, setContactError] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactValue, setContactValue] = useState("");
  const autoNavRef = useRef<number | null>(null);

  const orgLabel = orgDisplayName(context.orgName);
  const isHigh = rating >= 3;
  const isLow = rating >= 1 && rating <= 2;

  useEffect(() => {
    document.title = `How was your visit to ${orgLabel}?`;
  }, [orgLabel]);

  const goToReview = useCallback(() => {
    const href = buildGuestReviewHref(context, rating);
    router.push(href);
  }, [context, rating, router]);

  useEffect(() => {
    if (autoNavRef.current) {
      window.clearTimeout(autoNavRef.current);
      autoNavRef.current = null;
    }
    if (
      rating >= 3 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      autoNavRef.current = window.setTimeout(() => {
        goToReview();
      }, 1600);
    }
    return () => {
      if (autoNavRef.current) window.clearTimeout(autoNavRef.current);
    };
  }, [rating, goToReview]);

  function handleRatingChange(next: number) {
    setContactError("");
    setRating(next);
  }

  function handleShareContact() {
    const contact = contactValue.trim();
    if (!contact) {
      setContactError("Add a phone number or email, or use the button below.");
      return;
    }
    if (!EMAIL_OR_PHONE.test(contact)) {
      setContactError("Enter a valid email or phone number.");
      return;
    }
    setContactError("");
    goToReview();
  }

  function handleSkipContact() {
    setContactError("");
    goToReview();
  }

  return (
    <>
      <GuestFeedbackHeader />
      <main className="wrap guest-main guest-main--center">
        <span className="pill">{context.spotDisplayName}</span>
        <div className="card guest-card">
          <h1>
            How was your visit to <span className="org">{orgLabel}</span>?
          </h1>
          <p className="hint guest-lead">Takes 10 seconds. No sign-up.</p>

          <FeedbackStarRating value={rating} onChange={handleRatingChange} />

          {isHigh ? (
            <div className="fb-rev" role="status">
              <p>Let’s turn that into a quick public review.</p>
              <div className="fb-bar" aria-hidden="true" key={rating}>
                <i className="fb-bar-fill" />
              </div>
              <Button type="button" fullWidth onClick={goToReview}>
                Continue
              </Button>
              <p className="hint guest-demo-tag">
                Demo: continuing opens the review handoff (no data saved).
              </p>
            </div>
          ) : null}

          {isLow ? (
            <div className="fb-rev fb-rev--low">
              <h2>We’re sorry that happened.</h2>
              <p className="hint fb-apology">
                We’ve told the manager, and someone will come to your table
                shortly. If you’d like a follow-up, leave a way to reach you.
              </p>
              <label htmlFor="fb-name">
                Name <span className="hint">(optional)</span>
              </label>
              <input
                id="fb-name"
                autoComplete="name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <label htmlFor="fb-contact">
                Phone or email <span className="hint">(optional)</span>
              </label>
              <input
                id="fb-contact"
                autoComplete="email"
                inputMode="email"
                value={contactValue}
                onChange={(e) => {
                  setContactValue(e.target.value);
                  if (contactError) setContactError("");
                }}
              />
              <p className="err" role={contactError ? "alert" : undefined}>
                {contactError}
              </p>
              <div className="acts acts--stack">
                <Button type="button" onClick={handleShareContact}>
                  Share my contact
                </Button>
                <Button type="button" variant="ghost" onClick={handleSkipContact}>
                  I don’t want to share my contact
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
