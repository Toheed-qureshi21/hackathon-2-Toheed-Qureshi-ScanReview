import { buildLowRatingAlertContent } from "@/lib/email/alert-content";
import {
  logLowRatingAlertOutcome,
  type AlertLogStatus,
} from "@/lib/email/alert-log";
import type {
  BrevoSendInput,
  BrevoSendResult,
} from "@/lib/email/brevo-request";
import {
  resolveAlertRecipient,
  type AlertRecipientMember,
  type AlertRecipientOrganization,
} from "@/lib/services/alert-recipient";

export type SendTransactionalEmailFn = (
  input: BrevoSendInput,
) => Promise<BrevoSendResult>;

export function alertStatusFromSendResult(
  result: BrevoSendResult,
): AlertLogStatus {
  if (result.ok) return "sent";
  if (result.reason === "unconfigured") return "skipped_unconfigured";
  return "failed";
}

export function alertStatusFromSendResults(
  results: readonly BrevoSendResult[],
): AlertLogStatus {
  if (results.some((result) => result.ok)) return "sent";
  if (
    results.length > 0 &&
    results.every((result) => !result.ok && result.reason === "unconfigured")
  ) {
    return "skipped_unconfigured";
  }
  return "failed";
}

export async function deliverLowRatingAlert(input: {
  feedbackId: string;
  organization: (AlertRecipientOrganization & { name: string }) | null;
  members: AlertRecipientMember[];
  spot: { displayName: string } | null;
  rating: number;
  createdAt: Date;
  comment: string | null;
  sendEmail: SendTransactionalEmailFn;
}): Promise<AlertLogStatus> {
  try {
    if (!input.organization || !input.spot) {
      logLowRatingAlertOutcome({
        feedbackId: input.feedbackId,
        status: "failed",
      });
      return "failed";
    }

    const recipient = resolveAlertRecipient(
      input.organization,
      input.members,
    );
    if (!recipient.ok) {
      logLowRatingAlertOutcome({
        feedbackId: input.feedbackId,
        status: "skipped_no_recipient",
      });
      return "skipped_no_recipient";
    }

    const content = buildLowRatingAlertContent({
      organizationName: input.organization.name,
      spotDisplayName: input.spot.displayName,
      rating: input.rating,
      createdAt: input.createdAt,
      comment: input.comment,
    });

    const results: BrevoSendResult[] = [];
    for (const toEmail of recipient.emails) {
      results.push(
        await input.sendEmail({
          toEmail,
          subject: content.subject,
          text: content.text,
          html: content.html,
        }),
      );
    }

    const status = alertStatusFromSendResults(results);
    logLowRatingAlertOutcome({
      feedbackId: input.feedbackId,
      status,
    });
    return status;
  } catch {
    logLowRatingAlertOutcome({
      feedbackId: input.feedbackId,
      status: "failed",
    });
    return "failed";
  }
}
