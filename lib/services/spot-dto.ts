import {
  publicSpotFeedbackPath,
  publicSpotFeedbackUrl,
} from "@/lib/feedback/public-spot-url";
import { publicQrImageUrl } from "@/lib/storage/qr-codes-constants";
import type { SpotListItem } from "@/types/spot";

export type SpotRecordForDto = {
  id: string;
  number: number;
  displayName: string;
  publicToken: string;
  qrStoragePath: string | null;
};

export function buildSpotListItem(
  organizationId: string,
  spot: SpotRecordForDto,
  appOrigin: string,
  supabaseProjectUrl: string,
): SpotListItem {
  const qrImageUrl = spot.qrStoragePath
    ? publicQrImageUrl(supabaseProjectUrl, spot.qrStoragePath)
    : null;

  return {
    id: spot.id,
    number: spot.number,
    displayName: spot.displayName,
    publicToken: spot.publicToken,
    publicFeedbackPath: publicSpotFeedbackPath(
      organizationId,
      spot.publicToken,
    ),
    publicFeedbackUrl: publicSpotFeedbackUrl(
      appOrigin,
      organizationId,
      spot.publicToken,
    ),
    qrStoragePath: spot.qrStoragePath,
    qrImageUrl,
  };
}

/** Onboarding success responses require a persisted QR path. */
export function buildOnboardingSpotDto(
  organizationId: string,
  spot: SpotRecordForDto,
  appOrigin: string,
  supabaseProjectUrl: string,
) {
  if (!spot.qrStoragePath) {
    throw new Error("Spot is missing persisted QR storage path.");
  }
  const item = buildSpotListItem(
    organizationId,
    spot,
    appOrigin,
    supabaseProjectUrl,
  );
  if (!item.qrImageUrl) {
    throw new Error("Spot is missing public QR image URL.");
  }
  return {
    ...item,
    qrStoragePath: item.qrStoragePath!,
    qrImageUrl: item.qrImageUrl,
  };
}
