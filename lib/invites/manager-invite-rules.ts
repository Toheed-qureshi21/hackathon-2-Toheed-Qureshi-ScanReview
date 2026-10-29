export const MANAGER_INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export function normalizeManagerEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailsMatch(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  if (!left || !right) {
    return false;
  }
  return normalizeManagerEmail(left) === normalizeManagerEmail(right);
}

export function isSelfInvite(
  adminEmail: string | null | undefined,
  managerEmail: string,
): boolean {
  return emailsMatch(adminEmail, managerEmail);
}

export type ManagerInviteEligibility =
  | { ok: true }
  | {
      ok: false;
      code:
        | "SELF_INVITE"
        | "MANAGER_EXISTS"
        | "AMBIGUOUS_PENDING_EMAIL"
        | "MEMBERSHIP_EXISTS";
      message: string;
    };

export function evaluateManagerInviteEligibility(input: {
  adminEmail: string | null | undefined;
  managerEmail: string;
  hasExistingManager: boolean;
  otherPendingOrganizationIds: string[];
  inviteeAlreadyHasMembership: boolean;
}): ManagerInviteEligibility {
  if (isSelfInvite(input.adminEmail, input.managerEmail)) {
    return {
      ok: false,
      code: "SELF_INVITE",
      message: "You cannot invite your own email as a manager.",
    };
  }
  if (input.hasExistingManager) {
    return {
      ok: false,
      code: "MANAGER_EXISTS",
      message: "This organization already has a manager.",
    };
  }
  if (input.inviteeAlreadyHasMembership) {
    return {
      ok: false,
      code: "MEMBERSHIP_EXISTS",
      message: "That email already belongs to an organization.",
    };
  }
  if (input.otherPendingOrganizationIds.length > 0) {
    return {
      ok: false,
      code: "AMBIGUOUS_PENDING_EMAIL",
      message: "That email already has a pending invite. Ask them to finish it, or use a different email.",
    };
  }
  return { ok: true };
}

export function inviteExpiryFrom(now = new Date()): Date {
  return new Date(now.getTime() + MANAGER_INVITE_TTL_MS);
}

export function isInviteExpired(
  expiresAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) {
    return true;
  }
  return expiresAt.getTime() <= now.getTime();
}

export function isInviteConsumed(acceptedAt: Date | null | undefined): boolean {
  return acceptedAt != null;
}
