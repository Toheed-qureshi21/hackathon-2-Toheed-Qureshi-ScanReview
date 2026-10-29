import type { MemberRoleLiteral } from "@/lib/auth/me-mapper";
import {
  assertOrganizationMatchesMembership,
  OrganizationAccessDeniedError,
} from "@/lib/auth/organization-access";

type MembershipInput =
  | {
      ok: true;
      member: { organizationId: string; role: string };
    }
  | { ok: false; reason: "unauthenticated" | "no_membership" };

export type FeedbackListAccess =
  | { ok: true; organizationId: string; role: MemberRoleLiteral }
  | { ok: false; status: 401 | 403; code: string; message: string };

/**
 * Authorize GET /api/feedback from trusted membership, never from a client org id.
 * ADMIN and MANAGER may list; a mismatched organizationId is rejected.
 */
export function authorizeFeedbackList(input: {
  membership: MembershipInput;
  requestedOrganizationId?: string | null;
}): FeedbackListAccess {
  if (!input.membership.ok) {
    if (input.membership.reason === "unauthenticated") {
      return {
        ok: false,
        status: 401,
        code: "UNAUTHENTICATED",
        message: "Sign in to continue.",
      };
    }
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Complete onboarding to view feedback.",
    };
  }

  const role = input.membership.member.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "You cannot view this organization's feedback.",
    };
  }

  try {
    assertOrganizationMatchesMembership(
      input.membership.member.organizationId,
      input.requestedOrganizationId,
    );
  } catch (error) {
    if (error instanceof OrganizationAccessDeniedError) {
      return {
        ok: false,
        status: 403,
        code: "FORBIDDEN",
        message: "You cannot access another organization.",
      };
    }
    throw error;
  }

  return {
    ok: true,
    organizationId: input.membership.member.organizationId,
    role,
  };
}
