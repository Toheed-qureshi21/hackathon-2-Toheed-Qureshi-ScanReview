export type AlertLogStatus =
  | "sent"
  | "skipped_no_recipient"
  | "skipped_unconfigured"
  | "failed";

const LOG_KEYS = ["feedbackId", "status"] as const;

/** Sanitized process-local log. No secrets, payloads, or guest contact. */
export function logLowRatingAlertOutcome(input: {
  feedbackId: string;
  status: AlertLogStatus;
}): void {
  console.info("[low-rating-alert]", {
    feedbackId: input.feedbackId,
    status: input.status,
  });
}

export function alertLogPayloadKeys(): readonly string[] {
  return LOG_KEYS;
}
