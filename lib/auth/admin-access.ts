import type { MemberRoleLiteral } from "@/lib/auth/me-mapper";

type MembershipInput =
  | {
      ok: true;
      member: { organizationId: string; role: string };
    }
  | { ok: false; reason: "unauthenticated" | "no_membership" };

export type AdminAccess =
  | { ok: true; organizationId: string; role: MemberRoleLiteral }
  | { ok: false; status: 401 | 403; code: string; message: string };

/** ADMIN-only operations (invites, spot mutations). MANAGER is forbidden. */
export function authorizeAdminMembership(
  membership: MembershipInput,
  options?: { forbiddenMessage?: string },
): AdminAccess {
  if (!membership.ok) {
    if (membership.reason === "unauthenticated") {
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
      message: "Complete onboarding to continue.",
    };
  }

  if (membership.member.role !== "ADMIN") {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message:
        options?.forbiddenMessage ??
        "Only an admin can invite a manager.",
    };
  }

  return {
    ok: true,
    organizationId: membership.member.organizationId,
    role: "ADMIN",
  };
}
