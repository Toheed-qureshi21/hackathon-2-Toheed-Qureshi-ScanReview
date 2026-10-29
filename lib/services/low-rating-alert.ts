import "server-only";

import { logLowRatingAlertOutcome, type AlertLogStatus } from "@/lib/email/alert-log";
import { sendBrevoTransactionalEmail } from "@/lib/email/brevo";
import { prisma } from "@/lib/db/prisma";
import {
  deliverLowRatingAlert,
  type SendTransactionalEmailFn,
} from "@/lib/services/low-rating-alert-deliver";

/** Caller must already decide this is a 1–2 rating without contact follow-up. */
export async function attemptLowRatingAlertAfterPersist(input: {
  feedbackId: string;
  organizationId: string;
  spotId: string;
  rating: number;
  createdAt: Date;
  comment: string | null;
  sendEmail?: SendTransactionalEmailFn;
}): Promise<AlertLogStatus> {
  try {
    const [organization, members, spot] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: input.organizationId },
        select: {
          name: true,
          alertRecipient: true,
          pendingManagerEmail: true,
        },
      }),
      prisma.member.findMany({
        where: { organizationId: input.organizationId },
        select: { role: true, alertEmail: true },
      }),
      prisma.spot.findUnique({
        where: { id: input.spotId },
        select: { displayName: true },
      }),
    ]);

    return deliverLowRatingAlert({
      feedbackId: input.feedbackId,
      organization,
      members,
      spot,
      rating: input.rating,
      createdAt: input.createdAt,
      comment: input.comment,
      sendEmail: input.sendEmail ?? sendBrevoTransactionalEmail,
    });
  } catch {
    logLowRatingAlertOutcome({
      feedbackId: input.feedbackId,
      status: "failed",
    });
    return "failed";
  }
}
