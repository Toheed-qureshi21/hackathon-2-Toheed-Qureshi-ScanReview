import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { PublicSpotDto } from "@/types/public-feedback";

export class PublicSpotNotFoundError extends Error {
  readonly name = "PublicSpotNotFoundError";
}

export async function resolvePublicSpot(input: {
  token: string;
  organizationId: string;
}): Promise<PublicSpotDto> {
  const spot = await prisma.spot.findUnique({
    where: { publicToken: input.token },
    select: {
      organizationId: true,
      displayName: true,
      organization: {
        select: {
          name: true,
          publicReviewUrl: true,
        },
      },
    },
  });

  if (!spot || spot.organizationId !== input.organizationId) {
    throw new PublicSpotNotFoundError();
  }

  return {
    organizationName: spot.organization.name,
    spotDisplayName: spot.displayName,
    publicReviewUrl: spot.organization.publicReviewUrl,
  };
}

export type ResolvedSpotForWrite = {
  id: string;
  organizationId: string;
};

export async function resolveSpotForFeedbackWrite(input: {
  token: string;
  organizationId: string;
}): Promise<ResolvedSpotForWrite> {
  const spot = await prisma.spot.findUnique({
    where: { publicToken: input.token },
    select: { id: true, organizationId: true },
  });

  if (!spot || spot.organizationId !== input.organizationId) {
    throw new PublicSpotNotFoundError();
  }

  return spot;
}
