"use client";

import { FeedbackStarRating } from "@/components/feedback/feedback-star-rating";
import { GuestFeedbackHeader } from "@/components/feedback/guest-feedback-header";
import { Button } from "@/components/ui/button";
import { useSubmitPublicFeedback } from "@/hooks/mutations/use-submit-public-feedback";
import { ApiClientError } from "@/lib/api/api-error";
import { buildGuestReviewHref } from "@/lib/feedback/guest-review-navigation";
import {
  isHighRating,
  isLowRating,
  shouldPersistGuestRating,
} from "@/lib/feedback/guest-submit-flow";
import type { GuestFeedbackContext } from "@/lib/mocks/guest-feedback";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const EMAIL_OR_PHONE = /^(\S+@\S+\.\S+|[+]?[\d\s().-]{7,})$/;

type GuestFeedbackExperienceProps = {
  context: GuestFeedbackContext;
  organizationId?: string;
  token?: string;
};

function orgDisplayName(orgName: string) {
  const trimmed = orgName.trim();
  return trimmed.length > 0 ? trimmed : "our restaurant";
}

export function GuestFeedbackExperience({
  context,
  organizationId,
  token,
}: GuestFeedbackExperienceProps) {
  const router = useRouter();
  const persistEnabled = shouldPersistGuestRating(context.demo);
  const submitFeedback = useSubmitPublicFeedback();

  const [rating, setRating] = useState(0);
  const [contactError, setContactError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [lowRatingReady, setLowRatingReady] = useState(false);
  const autoNavRef = useRef<number | null>(null);
  const persistedRatingRef = useRef<number | null>(null);

  const orgLabel = orgDisplayName(context.orgName);
  const isHigh = isHighRating(rating);
  const isLow = isLowRating(rating);
  const pending = submitFeedback.isPending;

  useEffect(() => {
    document.title = `How was your visit to ${orgLabel}?`;
  }, [orgLabel]);

  const goToReview = useCallback(() => {
    const href = buildGuestReviewHref(context, rating);
    router.push(href);
  }, [context, rating, router]);

  const persistRating = useCallback(
    async (nextRating: number, extras?: { contactName?: string; contact?: string }) => {
      if (!persistEnabled) return true;
      if (!organizationId || !token) {
        setSubmitError("This feedback link isn’t valid.");
        return false;
      }
      if (
        persistedRatingRef.current === nextRating &&
        !extras?.contact &&
        !extras?.contactName
      ) {
        return true;
      }
      try {
        await submitFeedback.mutateAsync({
          organizationId,
          token,
          rating: nextRating,
          contactName: extras?.contactName || null,
          contact: extras?.contact || null,
          comment: null,
        });
        persistedRatingRef.current = nextRating;
        return true;
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Could not save your rating. Try again.";
        setSubmitError(message);
        return false;
      }
    },
    [organizationId, persistEnabled, submitFeedback, token],
  );

  useEffect(() => {
    if (autoNavRef.current) {
      window.clearTimeout(autoNavRef.current);
      autoNavRef.current = null;
    }
    if (
      isHigh &&
      !pending &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      autoNavRef.current = window.setTimeout(() => {
        void (async () => {
          const ok = await persistRating(rating);
          if (ok) goToReview();
        })();
      }, 1600);
    }
    return () => {
      if (autoNavRef.current) window.clearTimeout(autoNavRef.current);
    };
  }, [goToReview, isHigh, pending, persistRating, rating]);

  async function handleRatingChange(next: number) {
    setContactError("");
    setSubmitError("");
    setRating(next);
    persistedRatingRef.current = null;
    setLowRatingReady(false);

    if (isLowRating(next) && persistEnabled) {
      const ok = await persistRating(next);
      if (ok) setLowRatingReady(true);
      return;
    }

    if (isLowRating(next) && !persistEnabled) {
      setLowRatingReady(true);
    }
  }

  async function handleShareContact() {
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
    setSubmitError("");
    const ok = await persistRating(rating, {
      contactName: contactName.trim(),
      contact,
    });
    if (ok) goToReview();
  }

  async function handleSkipContact() {
    setContactError("");
    setSubmitError("");
    const ok = await persistRating(rating);
    if (ok) goToReview();
  }

  async function handleContinueHigh() {
    setSubmitError("");
    const ok = await persistRating(rating);
    if (ok) goToReview();
  }

  const showLowForm = isLow && lowRatingReady;

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

          <FeedbackStarRating
            value={rating}
            onChange={(next) => void handleRatingChange(next)}
            disabled={pending}
          />

          {isHigh ? (
            <div className="fb-rev" role="status">
              <p>Let’s turn that into a quick public review.</p>
              <div className="fb-bar" aria-hidden="true" key={rating}>
                <i className="fb-bar-fill" />
              </div>
              <Button
                type="button"
                fullWidth
                onClick={() => void handleContinueHigh()}
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? "Saving…" : "Continue"}
              </Button>
              {context.demo ? (
                <p className="hint guest-demo-tag">
                  Demo: continuing opens the review handoff (no data saved).
                </p>
              ) : null}
            </div>
          ) : null}

          {showLowForm ? (
            <div className="fb-rev fb-rev--low">
              <h2>We’re sorry that happened.</h2>
              <p className="hint fb-apology">
                If you’d like a follow-up, leave a way to reach you. You can
                also skip this step.
              </p>
              <label htmlFor="fb-name">
                Name <span className="hint">(optional)</span>
              </label>
              <input
                id="fb-name"
                autoComplete="name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                disabled={pending}
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
                disabled={pending}
              />
              <p className="err" role={contactError ? "alert" : undefined}>
                {contactError}
              </p>
              <div className="acts acts--stack">
                <Button
                  type="button"
                  onClick={() => void handleShareContact()}
                  disabled={pending}
                  aria-busy={pending}
                >
                  {pending ? "Saving…" : "Share my contact"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleSkipContact()}
                  disabled={pending}
                >
                  I don’t want to share my contact
                </Button>
              </div>
            </div>
          ) : null}

          {submitError ? (
            <p className="err" role="alert">
              {submitError}
            </p>
          ) : null}
        </div>
      </main>
    </>
  );
}
