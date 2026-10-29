import "server-only";

import { getTrustedAppOrigin } from "@/lib/env/app-origin";
import { prisma } from "@/lib/db/prisma";
import { bindManagerInviteAuth } from "@/lib/invites/bind-manager-invite-auth";
import { supabaseManagerInviteAuth } from "@/lib/invites/manager-invite-auth";
import type { ManagerInviteAuthPort } from "@/lib/invites/manager-invite-auth-port";
import {
  evaluateManagerInviteEligibility,
  inviteExpiryFrom,
  normalizeManagerEmail,
} from "@/lib/invites/manager-invite-rules";
import type { ManagerInviteResult } from "@/types/manager-invite";

export class ManagerInviteError extends Error {
  readonly name = "ManagerInviteError";
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type InviteManagerInput = {
  organizationId: string;
  adminEmail: string | null | undefined;
  managerName: string;
  managerEmail: string;
};

export async function inviteManagerForOrganization(
  input: InviteManagerInput,
  auth: ManagerInviteAuthPort = supabaseManagerInviteAuth,
  now = new Date(),
): Promise<ManagerInviteResult> {
  const managerEmail = normalizeManagerEmail(input.managerEmail);
  const managerName = input.managerName.trim();
  const organizationId = input.organizationId;

  const [existingManager, otherPending, existingMember] = await Promise.all([
    prisma.member.findFirst({
      where: { organizationId, role: "MANAGER" },
      select: { id: true },
    }),
    prisma.organization.findMany({
      where: {
        id: { not: organizationId },
        inviteAcceptedAt: null,
        pendingManagerEmail: { equals: managerEmail, mode: "insensitive" },
      },
      select: { id: true },
    }),
    prisma.member.findFirst({
      where: {
        alertEmail: { equals: managerEmail, mode: "insensitive" },
      },
      select: { userId: true },
    }),
  ]);

  const eligibility = evaluateManagerInviteEligibility({
    adminEmail: input.adminEmail,
    managerEmail,
    hasExistingManager: Boolean(existingManager),
    otherPendingOrganizationIds: otherPending.map((row) => row.id),
    inviteeAlreadyHasMembership: Boolean(existingMember),
  });
  if (!eligibility.ok) {
    throw new ManagerInviteError(
      eligibility.code,
      eligibility.message,
      eligibility.code === "SELF_INVITE" ? 422 : 409,
    );
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      alertRecipient: "MANAGER_PENDING",
      pendingManagerName: managerName,
      pendingManagerEmail: managerEmail,
      inviteAcceptedAt: null,
    },
  });

  const redirectTo = `${getTrustedAppOrigin()}/auth/confirm`;
  const invited = await auth.inviteUserByEmail(managerEmail, redirectTo);
  const bound = await bindManagerInviteAuth({
    invited,
    organizationId,
    email: managerEmail,
    auth,
  });

  if (!bound.ok) {
    if (bound.reason === "already_registered") {
      throw new ManagerInviteError(
        "EMAIL_ALREADY_REGISTERED",
        "That email already has an account. Use a different address.",
        409,
      );
    }
    return {
      requested: true,
      sent: false,
      email: managerEmail,
      notice: bound.notice,
    };
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      inviteSentAt: now,
      inviteExpiresAt: inviteExpiryFrom(now),
      inviteAcceptedAt: null,
    },
  });

  return {
    requested: true,
    sent: true,
    email: managerEmail,
    notice: `Invite sent to ${managerEmail}. They can set a password from the email link.`,
  };
}
