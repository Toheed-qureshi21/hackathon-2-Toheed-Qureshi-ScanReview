import { SPOT_COUNT_MAX } from "@/lib/onboarding/constants";
import { ApiClientError } from "@/lib/api/api-error";
import type { CreateSpotResponse, SpotsListResponse } from "@/types/spot";

export const ADD_SPOT_LIMIT_MESSAGE =
  "This organization already has 50 QR codes, the maximum allowed.";

export function isAtSpotLimit(
  spotCount: number,
  maxSpots = SPOT_COUNT_MAX,
): boolean {
  return spotCount >= maxSpots;
}

export function canAddSpot(input: {
  isAdmin: boolean;
  spotCount: number;
  isPending: boolean;
  maxSpots?: number;
}): boolean {
  if (!input.isAdmin || input.isPending) {
    return false;
  }
  return !isAtSpotLimit(input.spotCount, input.maxSpots);
}

export function addSpotErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "SPOT_LIMIT_REACHED") {
      return ADD_SPOT_LIMIT_MESSAGE;
    }
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unable to create a QR code right now.";
}

export function addSpotSuccessMessage(displayName: string): string {
  return `Created ${displayName}.`;
}

export function appendCreatedSpotToList(
  current: SpotsListResponse,
  created: CreateSpotResponse,
): SpotsListResponse {
  const alreadyListed = current.spots.some(
    (spot) => spot.id === created.spot.id,
  );
  const spots = alreadyListed
    ? current.spots
    : [...current.spots, created.spot].sort((a, b) => a.number - b.number);

  return {
    organization: created.organization,
    spots,
  };
}
