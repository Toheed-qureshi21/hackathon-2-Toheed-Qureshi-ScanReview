import "server-only";

import { formatSpotName } from "@/lib/onboarding/constants";
import { getTrustedAppOrigin } from "@/lib/env/app-origin";
import { getPublicEnv } from "@/lib/env/public";
import { publicSpotFeedbackUrl } from "@/lib/feedback/public-spot-url";
import { prisma } from "@/lib/db/prisma";
import type { SupabaseAuthUser } from "@/lib/auth/me-mapper";
import { buildOnboardingSpotDto } from "@/lib/services/spot-dto";
import { generatePublicSpotToken } from "@/lib/spots/public-token";
import { renderQrPngBuffer } from "@/lib/spots/render-qr-png";
import {
  removeQrObjects,
  uploadSpotQrPng,
} from "@/lib/storage/qr-code-storage";
import { spotQrStoragePath } from "@/lib/storage/qr-codes-constants";
import {
  inviteManagerForOrganization,
  ManagerInviteError,
} from "@/lib/services/manager-invite";
import type { CreateOrganizationResponse } from "@/types/organization-onboarding";
import { normalizeManagerEmail } from "@/lib/invites/manager-invite-rules";

export class OrganizationAlreadyExistsError extends Error {
  readonly name = "OrganizationAlreadyExistsError";
}

export class QrPersistenceFailedError extends Error {
  readonly name = "QrPersistenceFailedError";
}

export type OnboardingDomainInput = {
  name: string;
  businessType: string;
  labelPreset: string;
  customLabel: string | null;
  spotLabel: string;
  publicReviewUrl: string | null;
  alertRecipient: "me" | "manager";
  managerName: string | null;
  managerEmail: string | null;
  spotCount: number;
};

type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

type CreatedSpotRow = {
  id: string;
  number: number;
  displayName: string;
  publicToken: string;
};

async function reservePublicToken(tx: TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const token = generatePublicSpotToken();
    const existing = await tx.spot.findUnique({
      where: { publicToken: token },
      select: { id: true },
    });
    if (!existing) {
      return token;
    }
  }
  throw new Error("Unable to allocate a unique public token.");
}

async function rollbackOnboardingAttempt(
  organizationId: string,
  uploadedPaths: string[],
): Promise<void> {
  await removeQrObjects(uploadedPaths);
  try {
    await prisma.organization.delete({ where: { id: organizationId } });
  } catch {
    console.error(
      "[onboarding] Failed to roll back organization after QR error:",
      organizationId,
    );
  }
}

export async function createOrganizationFromOnboarding(
  input: OnboardingDomainInput,
  user: SupabaseAuthUser,
): Promise<CreateOrganizationResponse> {
  const appOrigin = getTrustedAppOrigin();
  const { NEXT_PUBLIC_SUPABASE_URL: supabaseProjectUrl } = getPublicEnv();

  const existingMember = await prisma.member.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existingMember) {
    throw new OrganizationAlreadyExistsError();
  }

  const alertRecipient =
    input.alertRecipient === "manager" ? "MANAGER_PENDING" : "ADMIN";

  const adminAlertEmail =
    input.alertRecipient === "me" ? (user.email?.trim() || null) : null;

  const created = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.name,
        businessType: input.businessType,
        labelPreset: input.labelPreset,
        customLabel: input.customLabel,
        spotLabel: input.spotLabel,
        publicReviewUrl: input.publicReviewUrl,
        alertRecipient,
        pendingManagerName:
          input.alertRecipient === "manager" ? input.managerName : null,
        pendingManagerEmail:
          input.alertRecipient === "manager" ? input.managerEmail : null,
      },
    });

    const membership = await tx.member.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "ADMIN",
        alertEmail: adminAlertEmail,
      },
    });

    const spotRows: CreatedSpotRow[] = [];

    for (let number = 1; number <= input.spotCount; number += 1) {
      const publicToken = await reservePublicToken(tx);
      const displayName = formatSpotName(input.spotLabel, number);
      const spot = await tx.spot.create({
        data: {
          organizationId: organization.id,
          number,
          displayName,
          publicToken,
        },
      });
      spotRows.push({
        id: spot.id,
        number: spot.number,
        displayName: spot.displayName,
        publicToken: spot.publicToken,
      });
    }

    return { organization, membership, spotRows };
  });

  const uploadedPaths: string[] = [];

  try {
    for (const spot of created.spotRows) {
      const feedbackUrl = publicSpotFeedbackUrl(
        appOrigin,
        created.organization.id,
        spot.publicToken,
      );
      const png = await renderQrPngBuffer(feedbackUrl);
      const storagePath = spotQrStoragePath(
        created.organization.id,
        spot.id,
      );
      await uploadSpotQrPng(storagePath, png);
      uploadedPaths.push(storagePath);

      await prisma.spot.update({
        where: { id: spot.id },
        data: { qrStoragePath: storagePath },
      });
    }
  } catch {
    await rollbackOnboardingAttempt(created.organization.id, uploadedPaths);
    throw new QrPersistenceFailedError();
  }

  const spots = created.spotRows.map((spot) => {
    const qrStoragePath = spotQrStoragePath(
      created.organization.id,
      spot.id,
    );
    return buildOnboardingSpotDto(
      created.organization.id,
      { ...spot, qrStoragePath },
      appOrigin,
      supabaseProjectUrl,
    );
  });

  const managerRequested = input.alertRecipient === "manager";
  const managerEmail = input.managerEmail
    ? normalizeManagerEmail(input.managerEmail)
    : null;

  let managerInvite: CreateOrganizationResponse["managerInvite"] = {
    requested: false,
    sent: false,
    email: null,
    notice: "Low-rating alerts will go to your admin email.",
  };

  if (managerRequested && managerEmail && input.managerName) {
    try {
      managerInvite = await inviteManagerForOrganization({
        organizationId: created.organization.id,
        adminEmail: user.email,
        managerName: input.managerName,
        managerEmail,
      });
    } catch (error) {
      const notice =
        error instanceof ManagerInviteError
          ? error.message
          : "Manager details were saved, but the invite email could not be sent. You can try again.";
      managerInvite = {
        requested: true,
        sent: false,
        email: managerEmail,
        notice,
      };
    }
  }

  return {
    organization: {
      id: created.organization.id,
      name: created.organization.name,
      businessType: created.organization.businessType,
      spotLabel: created.organization.spotLabel,
      publicReviewUrl: created.organization.publicReviewUrl,
    },
    membership: {
      id: created.membership.id,
      role: "ADMIN",
    },
    spots,
    managerInvite,
  };
}
