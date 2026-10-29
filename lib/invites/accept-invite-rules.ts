import {
  emailsMatch,
  isInviteConsumed,
  isInviteExpired,
} from "@/lib/invites/manager-invite-rules";
import {
  parseInviteAppMetadata,
  type ManagerInviteAppMetadata,
} from "@/lib/invites/manager-invite-metadata";

export type AcceptInviteOrganization = {
  id: string;
  pendingManagerEmail: string | null;
  inviteExpiresAt: Date | null;
  inviteAcceptedAt: Date | null;
};

export type AcceptInviteDecision =
  | {
      ok: true;
      organizationId: string;
      email: string;
      metadata: ManagerInviteAppMetadata;
    }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "INVITE_NOT_FOUND"
        | "EMAIL_MISMATCH"
        | "ORGANIZATION_MISMATCH"
        | "INVITE_EXPIRED"
        | "INVITE_CONSUMED"
        | "MANAGER_EXISTS"
        | "MEMBERSHIP_EXISTS";
      message: string;
      status: 401 | 403 | 409 | 410;
    };

/**
 * Authorize manager acceptance from trusted session + app_metadata + org row.
 * Client-supplied role/organizationId arguments are ignored.
 */
export function evaluateAcceptInvite(input: {
  userId: string | null | undefined;
  email: string | null | undefined;
  appMetadata: Record<string, unknown> | null | undefined;
  userMetadata: Record<string, unknown> | null | undefined;
  organization: AcceptInviteOrganization | null;
  hasExistingManager: boolean;
  existingMembershipUserId: string | null;
  clientRole?: unknown;
  clientOrganizationId?: unknown;
  now?: Date;
}): AcceptInviteDecision {
  void input.userMetadata;
  void input.clientRole;
  void input.clientOrganizationId;

  if (!input.userId || !input.email) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Sign in to continue.",
    };
  }

  const metadata = parseInviteAppMetadata(input.appMetadata);
  if (!metadata) {
    return {
      ok: false,
      status: 403,
      code: "INVITE_NOT_FOUND",
      message: "This invite is not valid.",
    };
  }

  if (!input.organization) {
    return {
      ok: false,
      status: 403,
      code: "INVITE_NOT_FOUND",
      message: "This invite is not valid.",
    };
  }

  if (input.organization.id !== metadata.organizationId) {
    return {
      ok: false,
      status: 403,
      code: "ORGANIZATION_MISMATCH",
      message: "This invite does not match your organization.",
    };
  }

  if (!emailsMatch(input.email, input.organization.pendingManagerEmail)) {
    return {
      ok: false,
      status: 403,
      code: "EMAIL_MISMATCH",
      message: "This invite was sent to a different email address.",
    };
  }

  if (isInviteConsumed(input.organization.inviteAcceptedAt)) {
    return {
      ok: false,
      status: 409,
      code: "INVITE_CONSUMED",
      message: "This invite has already been accepted.",
    };
  }

  if (isInviteExpired(input.organization.inviteExpiresAt, input.now)) {
    return {
      ok: false,
      status: 410,
      code: "INVITE_EXPIRED",
      message: "This invite has expired. Ask your admin to send a new one.",
    };
  }

  if (input.hasExistingManager) {
    return {
      ok: false,
      status: 409,
      code: "MANAGER_EXISTS",
      message: "This organization already has a manager.",
    };
  }

  if (
    input.existingMembershipUserId &&
    input.existingMembershipUserId === input.userId
  ) {
    return {
      ok: false,
      status: 409,
      code: "MEMBERSHIP_EXISTS",
      message: "You already belong to an organization.",
    };
  }

  if (input.existingMembershipUserId) {
    return {
      ok: false,
      status: 409,
      code: "MEMBERSHIP_EXISTS",
      message: "You already belong to an organization.",
    };
  }

  return {
    ok: true,
    organizationId: metadata.organizationId,
    email: input.email,
    metadata,
  };
}
