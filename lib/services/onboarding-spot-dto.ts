import {
  publicSpotFeedbackPath,
  publicSpotFeedbackUrl,
} from "@/lib/feedback/public-spot-url";
import { publicQrImageUrl } from "@/lib/storage/qr-codes-constants";
import type { OnboardingSpotDto } from "@/types/organization-onboarding";

type SpotRecord = {
  id: string;
  number: number;
  displayName: string;
  publicToken: string;
  qrStoragePath: string | null;
};

export function buildOnboardingSpotDto(
  organizationId: string,
  spot: SpotRecord,
  appOrigin: string,
  supabaseProjectUrl: string,
): OnboardingSpotDto {
  if (!spot.qrStoragePath) {
    throw new Error("Spot is missing persisted QR storage path.");
  }

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
    qrImageUrl: publicQrImageUrl(supabaseProjectUrl, spot.qrStoragePath),
  };
}
