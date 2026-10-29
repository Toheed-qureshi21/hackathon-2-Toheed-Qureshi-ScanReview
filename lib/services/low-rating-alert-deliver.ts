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

    const result = await input.sendEmail({
      toEmail: recipient.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });

    const status = alertStatusFromSendResult(result);
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
