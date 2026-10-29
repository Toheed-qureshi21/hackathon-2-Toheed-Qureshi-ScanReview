"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useCallback, useRef } from "react";

const STAR_LABELS = [
  "1 star",
  "2 stars",
  "3 stars",
  "4 stars",
  "5 stars",
] as const;

export const RATING_WORDS = [
  "Tap a star",
  "Poor",
  "Not great",
  "Okay",
  "Good",
  "Loved it",
] as const;

export const RATING_MESSAGES = [
  "",
  "Thanks for telling us. We want to fix this.",
  "Thanks for being honest with us.",
  "Thanks for the feedback. We’ll keep improving.",
  "Glad you had a good visit!",
  "Wonderful, that made our day!",
] as const;

type FeedbackStarRatingProps = {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
};

export function FeedbackStarRating({
  value,
  onChange,
  disabled = false,
}: FeedbackStarRatingProps) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const wordLabel = RATING_WORDS[value] ?? RATING_WORDS[0];
  const msgLabel = RATING_MESSAGES[value] ?? RATING_MESSAGES[0];
  const pulseKey = value > 0 ? value : 0;

  const setRating = useCallback(
    (rating: number) => {
      if (disabled) return;
      onChange(rating);
    },
    [disabled, onChange],
  );

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (disabled) return;
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      next = Math.min(4, index + 1);
      e.preventDefault();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      next = Math.max(0, index - 1);
      e.preventDefault();
    } else if (e.key === "Home") {
      next = 0;
      e.preventDefault();
    } else if (e.key === "End") {
      next = 4;
      e.preventDefault();
    } else {
      return;
    }
    setRating(next + 1);
    buttonsRef.current[next]?.focus();
  }

  return (
    <>
      <div
        className={cn("fb-stars", value > 0 && "lit")}
        role="radiogroup"
        aria-label="Your rating"
        aria-disabled={disabled || undefined}
      >
        {STAR_LABELS.map((label, index) => {
          const starValue = index + 1;
          const selected = value === starValue;
          const filled = value >= starValue && value > 0;
          return (
            <button
              key={starValue}
              ref={(el) => {
                buttonsRef.current[index] = el;
              }}
              type="button"
              className={cn("fb-star", filled && "on")}
              role="radio"
              aria-checked={selected}
              aria-label={label}
              disabled={disabled}
              style={{ ["--i" as string]: index }}
              onClick={() => setRating(starValue)}
              onKeyDown={(e) => onKeyDown(e, index)}
            >
              <Star strokeWidth={1.75} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <p
        key={`word-${pulseKey}`}
        className={cn("fb-word", value > 0 && "has", value > 0 && "pulse")}
        aria-live="polite"
      >
        {wordLabel}
      </p>
      <p
        key={`msg-${pulseKey}`}
        className={cn("fb-msg hint", value > 0 && "pulse")}
        aria-live="polite"
      >
        {msgLabel}
      </p>
    </>
  );
}
