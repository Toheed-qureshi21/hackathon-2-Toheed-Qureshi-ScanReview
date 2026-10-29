import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { SupabaseAuthUser } from "@/lib/auth/me-mapper";
import { evaluateAcceptInvite } from "@/lib/invites/accept-invite-rules";
import type { AcceptInviteResponse } from "@/types/manager-invite";

export class AcceptInviteError extends Error {
  readonly name = "AcceptInviteError";
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function acceptManagerInvite(
  user: SupabaseAuthUser,
  clientBody: { role?: unknown; organizationId?: unknown } = {},
  now = new Date(),
): Promise<AcceptInviteResponse> {
  const metadata = user.app_metadata ?? null;
  const organizationId =
    metadata && typeof metadata.organizationId === "string"
      ? metadata.organizationId
      : null;

  const [organization, existingMembership, existingManager] = await Promise.all([
    organizationId
      ? prisma.organization.findUnique({
          where: { id: organizationId },
          select: {
            id: true,
            name: true,
            pendingManagerEmail: true,
            inviteExpiresAt: true,
            inviteAcceptedAt: true,
          },
        })
      : Promise.resolve(null),
    prisma.member.findUnique({
      where: { userId: user.id },
      select: { userId: true },
    }),
    organizationId
      ? prisma.member.findFirst({
          where: { organizationId, role: "MANAGER" },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const decision = evaluateAcceptInvite({
    userId: user.id,
    email: user.email,
    appMetadata: user.app_metadata,
    userMetadata: user.user_metadata,
    organization,
    hasExistingManager: Boolean(existingManager),
    existingMembershipUserId: existingMembership?.userId ?? null,
    clientRole: clientBody.role,
    clientOrganizationId: clientBody.organizationId,
    now,
  });

  if (!decision.ok) {
    throw new AcceptInviteError(
      decision.code,
      decision.message,
      decision.status,
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const member = await tx.member.create({
      data: {
        userId: user.id,
        organizationId: decision.organizationId,
        role: "MANAGER",
        alertEmail: decision.email,
      },
    });
    const org = await tx.organization.update({
      where: { id: decision.organizationId },
      data: { inviteAcceptedAt: now },
      select: { id: true, name: true },
    });
    return { member, org };
  });

  return {
    membership: {
      id: created.member.id,
      role: "MANAGER",
    },
    organization: {
      id: created.org.id,
      name: created.org.name,
    },
  };
}
