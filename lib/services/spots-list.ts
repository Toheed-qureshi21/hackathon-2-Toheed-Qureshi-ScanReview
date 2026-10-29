import "server-only";

import { getTrustedAppOrigin } from "@/lib/env/app-origin";
import { getPublicEnv } from "@/lib/env/public";
import { prisma } from "@/lib/db/prisma";
import { buildSpotListItem } from "@/lib/services/spot-dto";
import type { ListSpotsQuery } from "@/lib/validations/spots-query";
import type { SpotsListResponse } from "@/types/spot";

export async function listSpotsForOrganization(
  organizationId: string,
  query: ListSpotsQuery = {},
): Promise<SpotsListResponse> {
  const appOrigin = getTrustedAppOrigin();
  const { NEXT_PUBLIC_SUPABASE_URL: supabaseProjectUrl } = getPublicEnv();

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { id: true, name: true, spotLabel: true },
  });

  const search = query.search?.trim().toLowerCase();
  const spots = await prisma.spot.findMany({
    where: {
      organizationId,
      ...(search
        ? {
            displayName: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: { number: "asc" },
    take: 50,
    select: {
      id: true,
      number: true,
      displayName: true,
      publicToken: true,
      qrStoragePath: true,
    },
  });

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      spotLabel: organization.spotLabel,
    },
    spots: spots.map((spot) =>
      buildSpotListItem(
        organization.id,
        spot,
        appOrigin,
        supabaseProjectUrl,
      ),
    ),
  };
}
