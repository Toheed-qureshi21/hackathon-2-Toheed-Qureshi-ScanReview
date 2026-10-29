import { z } from "zod";

/**
 * POST /api/spots accepts an empty or extra-keyed object.
 * Client organizationId, role, number, and publicToken are never kept.
 */
export const createSpotBodySchema = z
  .object({})
  .passthrough()
  .transform(() => ({}));

export type CreateSpotBody = z.infer<typeof createSpotBodySchema>;

/** Scope is always the session membership org — client IDs are not authoritative. */
export function resolveCreateSpotOrganizationId(
  membershipOrganizationId: string,
  _clientBody: unknown,
): string {
  void _clientBody;
  return membershipOrganizationId;
}
