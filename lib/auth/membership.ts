import "server-only";

import type { SupabaseAuthUser } from "@/lib/auth/me-mapper";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getMemberForUserId,
  type MemberWithOrganization,
} from "@/lib/services/auth-me";

export { OrganizationAccessDeniedError } from "@/lib/auth/organization-access";
export { assertOrganizationMatchesMembership } from "@/lib/auth/organization-access";

export type AuthenticatedMembership =
  | {
      ok: true;
      user: SupabaseAuthUser;
      member: MemberWithOrganization;
    }
  | { ok: false; reason: "unauthenticated" | "no_membership" };

/** Resolve the caller's organization membership from the session — never from client IDs. */
export async function requireOrganizationMembership(): Promise<AuthenticatedMembership> {
  const session = await getAuthenticatedUser();
  if (!session.ok) {
    return { ok: false, reason: "unauthenticated" };
  }

  const member = await getMemberForUserId(session.user.id);
  if (!member) {
    return { ok: false, reason: "no_membership" };
  }

  return { ok: true, user: session.user, member };
}
