import { EMAIL_PATTERN } from "@/lib/validations/public-feedback";

export type AlertRecipientMode = "ADMIN" | "MANAGER_PENDING";

export type AlertRecipientOrganization = {
  alertRecipient: AlertRecipientMode;
  pendingManagerEmail: string | null;
};

export type AlertRecipientMember = {
  role: "ADMIN" | "MANAGER";
  alertEmail: string | null;
};

export type AlertRecipientResult =
  | { ok: true; email: string }
  | { ok: false; reason: "no_recipient" };

function validEmail(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || !EMAIL_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/**
 * Unique administrator `alertEmail`, or null if none / more than one distinct
 * valid address (do not pick an arbitrary member).
 */
function uniqueAdminAlertEmail(
  members: AlertRecipientMember[],
): string | null {
  const emails = [
    ...new Set(
      members
        .filter((member) => member.role === "ADMIN")
        .map((member) => validEmail(member.alertEmail))
        .filter((email): email is string => email !== null),
    ),
  ];
  return emails.length === 1 ? emails[0] : null;
}

/**
 * Trusted alert recipient from organization configuration + membership.
 * Guest-supplied addresses are never considered.
 *
 * 1. MANAGER_PENDING: `Organization.pendingManagerEmail` when valid.
 *    Safe fallback: unique admin `Member.alertEmail` (product: alert the
 *    manager, or the admin if no manager email is available yet).
 * 2. ADMIN: unique administrator `Member.alertEmail` only.
 *
 * MANAGER members are ignored until invite acceptance changes membership
 * and recipient configuration (Phase 9). Never pick an arbitrary member.
 */
export function resolveAlertRecipient(
  organization: AlertRecipientOrganization,
  members: AlertRecipientMember[],
): AlertRecipientResult {
  if (organization.alertRecipient === "MANAGER_PENDING") {
    const pending = validEmail(organization.pendingManagerEmail);
    if (pending) return { ok: true, email: pending };
    const adminFallback = uniqueAdminAlertEmail(members);
    if (adminFallback) return { ok: true, email: adminFallback };
    return { ok: false, reason: "no_recipient" };
  }

  const adminEmail = uniqueAdminAlertEmail(members);
  if (adminEmail) return { ok: true, email: adminEmail };
  return { ok: false, reason: "no_recipient" };
}

/** Skip duplicate alerts from the guest UI's contact-sharing second POST. */
export function shouldAttemptLowRatingAlert(input: {
  rating: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}): boolean {
  if (input.rating < 1 || input.rating > 2) return false;
  if (input.contactName || input.contactEmail || input.contactPhone) {
    return false;
  }
  return true;
}

/**
 * After feedback is persisted: attempt an alert for ratings 1–2 without
 * contact fields. Swallows sender exceptions so the guest 201 is unchanged.
 * Returns whether an attempt was started (not whether email was delivered).
 */
export async function maybeAttemptLowRatingAlert(input: {
  rating: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  attempt: () => Promise<unknown>;
  onUnexpectedFailure: () => void;
}): Promise<boolean> {
  if (!shouldAttemptLowRatingAlert(input)) return false;
  try {
    await input.attempt();
  } catch {
    input.onUnexpectedFailure();
  }
  return true;
}
