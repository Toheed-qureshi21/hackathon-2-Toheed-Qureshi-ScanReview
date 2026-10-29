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
  | { ok: true; emails: string[] }
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
function uniqueRoleAlertEmail(
  members: AlertRecipientMember[],
  role: AlertRecipientMember["role"],
): string | null {
  const emails = [
    ...new Set(
      members
        .filter((member) => member.role === role)
        .map((member) => validEmail(member.alertEmail))
        .filter((email): email is string => email !== null),
    ),
  ];
  return emails.length === 1 ? emails[0] : null;
}

function uniqueAdminAlertEmail(
  members: AlertRecipientMember[],
): string | null {
  return uniqueRoleAlertEmail(members, "ADMIN");
}

function uniqueManagerAlertEmail(
  members: AlertRecipientMember[],
): string | null {
  return uniqueRoleAlertEmail(members, "MANAGER");
}

/**
 * Trusted alert recipient from organization configuration + membership.
 * Guest-supplied addresses are never considered.
 *
 * 1. MANAGER_PENDING: unique accepted MANAGER `alertEmail` when present,
 *    otherwise `Organization.pendingManagerEmail`, then the unique admin
 *    `Member.alertEmail` so the admin still receives a copy.
 * 2. ADMIN: unique administrator `Member.alertEmail` only.
 *
 * Never pick an arbitrary member or a guest-supplied address.
 */
export function resolveAlertRecipient(
  organization: AlertRecipientOrganization,
  members: AlertRecipientMember[],
): AlertRecipientResult {
  const emails: string[] = [];
  const seen = new Set<string>();
  const add = (value: string | null) => {
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    emails.push(value);
  };

  if (organization.alertRecipient === "MANAGER_PENDING") {
    const acceptedManager = uniqueManagerAlertEmail(members);
    add(acceptedManager);
    if (!acceptedManager) {
      add(validEmail(organization.pendingManagerEmail));
    }
  }

  add(uniqueAdminAlertEmail(members));

  if (emails.length === 0) {
    return { ok: false, reason: "no_recipient" };
  }
  return { ok: true, emails };
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
