import "server-only";

import { formatSpotName } from "@/lib/onboarding/constants";
import { getTrustedAppOrigin } from "@/lib/env/app-origin";
import {
  publicSpotFeedbackPath,
  publicSpotFeedbackUrl,
} from "@/lib/feedback/public-spot-url";
import { prisma } from "@/lib/db/prisma";
import type { SupabaseAuthUser } from "@/lib/auth/me-mapper";
import { generatePublicSpotToken } from "@/lib/spots/public-token";
import type { CreateOrganizationResponse } from "@/types/organization-onboarding";
export class OrganizationAlreadyExistsError extends Error {
  readonly name = "OrganizationAlreadyExistsError";
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

export async function createOrganizationFromOnboarding(
  input: OnboardingDomainInput,
  user: SupabaseAuthUser,
): Promise<CreateOrganizationResponse> {
  const appOrigin = getTrustedAppOrigin();

  return prisma.$transaction(async (tx) => {
    const existingMember = await tx.member.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (existingMember) {
      throw new OrganizationAlreadyExistsError();
    }

    const alertRecipient =
      input.alertRecipient === "manager" ? "MANAGER_PENDING" : "ADMIN";

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

    const adminAlertEmail =
      input.alertRecipient === "me" ? (user.email?.trim() || null) : null;

    const membership = await tx.member.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "ADMIN",
        alertEmail: adminAlertEmail,
      },
    });

    const spots: CreateOrganizationResponse["spots"] = [];

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
      spots.push({
        id: spot.id,
        number: spot.number,
        displayName: spot.displayName,
        publicToken: spot.publicToken,
        publicFeedbackPath: publicSpotFeedbackPath(
          organization.id,
          spot.publicToken,
        ),
        publicFeedbackUrl: publicSpotFeedbackUrl(
          appOrigin,
          organization.id,
          spot.publicToken,
        ),
      });
    }

    const managerRequested = input.alertRecipient === "manager";

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        businessType: organization.businessType,
        spotLabel: organization.spotLabel,
        publicReviewUrl: organization.publicReviewUrl,
      },
      membership: {
        id: membership.id,
        role: "ADMIN",
      },
      spots,
      managerInvite: {
        requested: managerRequested,
        sent: false,
        notice: managerRequested
          ? "Manager details were saved. Email invitations are not sent yet — that requires the manager-invite and Brevo slice."
          : "Low-rating alerts will go to your admin email once alerting is enabled.",
      },
    };
  });
}
