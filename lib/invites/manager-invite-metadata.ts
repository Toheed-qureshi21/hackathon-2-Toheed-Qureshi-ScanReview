export const MANAGER_INVITE_ROLE = "MANAGER" as const;

export type ManagerInviteAppMetadata = {
  organizationId: string;
  role: typeof MANAGER_INVITE_ROLE;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Read invite binding from admin-only app_metadata — never user_metadata. */
export function parseInviteAppMetadata(
  appMetadata: Record<string, unknown> | null | undefined,
): ManagerInviteAppMetadata | null {
  if (!appMetadata) {
    return null;
  }
  const organizationId = appMetadata.organizationId;
  const role = appMetadata.role;
  if (typeof organizationId !== "string" || !UUID_RE.test(organizationId)) {
    return null;
  }
  if (role !== MANAGER_INVITE_ROLE) {
    return null;
  }
  return { organizationId, role };
}

export function hasPendingManagerInviteMetadata(
  appMetadata: Record<string, unknown> | null | undefined,
): boolean {
  return parseInviteAppMetadata(appMetadata) !== null;
}
