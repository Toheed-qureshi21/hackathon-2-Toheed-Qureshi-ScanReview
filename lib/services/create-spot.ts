import "server-only";

import { getTrustedAppOrigin } from "@/lib/env/app-origin";
import { getPublicEnv } from "@/lib/env/public";
import { prisma } from "@/lib/db/prisma";
import { buildOnboardingSpotDto } from "@/lib/services/spot-dto";
import {
  allocateNextSpot,
  SpotLimitReachedError,
} from "@/lib/spots/allocate-next-spot";
import {
  persistCreatedSpotQr,
  QrPersistenceFailedError,
} from "@/lib/spots/persist-created-spot-qr";
import { reserveUniquePublicSpotToken } from "@/lib/spots/reserve-public-token";
import { renderQrPngBuffer } from "@/lib/spots/render-qr-png";
import {
  removeQrObjects,
  uploadSpotQrPng,
} from "@/lib/storage/qr-code-storage";
import type { CreateSpotResponse } from "@/types/spot";

export { SpotLimitReachedError } from "@/lib/spots/allocate-next-spot";
export { QrPersistenceFailedError } from "@/lib/spots/persist-created-spot-qr";

type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

function isRetryableWriteConflict(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }
  const code = (error as { code: unknown }).code;
  return code === "P2034" || code === "P2002" || code === "40001";
}

async function lockOrganizationForSpotCreate(
  tx: TransactionClient,
  organizationId: string,
): Promise<void> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Organization" WHERE id = ${organizationId} FOR UPDATE
  `;
  if (rows.length === 0) {
    throw new Error("Organization not found.");
  }
}

async function rollbackCreatedSpot(
  spotId: string,
  uploadedPaths: string[],
): Promise<void> {
  await removeQrObjects(uploadedPaths);
  try {
    await prisma.spot.delete({ where: { id: spotId } });
  } catch {
    console.error(
      "[spots] Failed to roll back spot after QR error:",
      spotId,
    );
  }
}

async function createAdditionalSpotOnce(
  organizationId: string,
): Promise<CreateSpotResponse> {
  const appOrigin = getTrustedAppOrigin();
  const { NEXT_PUBLIC_SUPABASE_URL: supabaseProjectUrl } = getPublicEnv();

  const created = await prisma.$transaction(
    async (tx) => {
      await lockOrganizationForSpotCreate(tx, organizationId);

      const organization = await tx.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { id: true, name: true, spotLabel: true },
      });

      const existing = await tx.spot.findMany({
        where: { organizationId },
        select: { number: true },
      });

      const allocation = allocateNextSpot(
        existing.map((spot) => spot.number),
        organization.spotLabel,
      );
      if (!allocation.ok) {
        throw new SpotLimitReachedError();
      }

      const publicToken = await reserveUniquePublicSpotToken(tx.spot);
      const spot = await tx.spot.create({
        data: {
          organizationId,
          number: allocation.number,
          displayName: allocation.displayName,
          publicToken,
        },
      });

      return {
        organization,
        spot: {
          id: spot.id,
          number: spot.number,
          displayName: spot.displayName,
          publicToken: spot.publicToken,
        },
      };
    },
    {
      isolationLevel: "Serializable",
      maxWait: 5_000,
      timeout: 15_000,
    },
  );

  const qrStoragePath = await persistCreatedSpotQr({
    organizationId: created.organization.id,
    spotId: created.spot.id,
    publicToken: created.spot.publicToken,
    appOrigin,
    renderPng: renderQrPngBuffer,
    upload: uploadSpotQrPng,
    savePath: async (spotId, storagePath) => {
      await prisma.spot.update({
        where: { id: spotId },
        data: { qrStoragePath: storagePath },
      });
    },
    rollback: rollbackCreatedSpot,
  });

  return {
    organization: created.organization,
    spot: buildOnboardingSpotDto(
      created.organization.id,
      { ...created.spot, qrStoragePath },
      appOrigin,
      supabaseProjectUrl,
    ),
  };
}

export async function createAdditionalSpot(
  organizationId: string,
): Promise<CreateSpotResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await createAdditionalSpotOnce(organizationId);
    } catch (error) {
      if (error instanceof SpotLimitReachedError) {
        throw error;
      }
      if (error instanceof QrPersistenceFailedError) {
        throw error;
      }
      if (isRetryableWriteConflict(error) && attempt < 2) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}
