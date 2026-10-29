/** Client-safe organization scope checks (no server imports). */

export class OrganizationAccessDeniedError extends Error {
  readonly name = "OrganizationAccessDeniedError";
}

/**
 * Reject cross-organization access when a client-supplied organization id
 * does not match the membership resolved from the session.
 */
export function assertOrganizationMatchesMembership(
  membershipOrganizationId: string,
  requestedOrganizationId: string | null | undefined,
): void {
  if (!requestedOrganizationId) {
    return;
  }
  if (requestedOrganizationId !== membershipOrganizationId) {
    throw new OrganizationAccessDeniedError();
  }
}
