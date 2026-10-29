/**
 * Guest feedback mock resolution (UI-only). Demo QR query params and PRD-shaped
 * mock org/spot IDs — not production tokens.
 */

import { formatSpotName } from "@/lib/onboarding/constants";
import { mockOrganization, mockQrSpots } from "@/lib/mocks/dashboard";

export type GuestFeedbackContext = {
  /** When true, URL uses /feedback/demo (query-driven demo QR). */
  demo: boolean;
  orgId: string;
  orgName: string;
  spotId: string;
  spotLabel: string;
  spotNumber: number;
  spotDisplayName: string;
  reviewUrl: string;
};

const DEMO_ORG_ID = mockOrganization.id;

export function getGuestContextByMockIds(
  orgId: string,
  spotId: string,
): GuestFeedbackContext | null {
  if (orgId !== DEMO_ORG_ID) return null;
  const spot = mockQrSpots.find((s) => s.id === spotId);
  if (!spot) return null;

  return {
    demo: false,
    orgId,
    orgName: mockOrganization.name,
    spotId: spot.id,
    spotLabel: spot.spotLabel,
    spotNumber: spot.spotNumber,
    spotDisplayName: spot.name,
    reviewUrl: mockOrganization.reviewUrl,
  };
}

function readParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Resolve `/feedback/demo?org=&label=&n=&demo=1&link=` from QR previews. */
export function getGuestContextFromDemoQuery(
  searchParams: Record<string, string | string[] | undefined>,
): GuestFeedbackContext | null {
  const demo = readParam(searchParams.demo);
  if (demo !== "1") return null;

  const orgName = readParam(searchParams.org)?.trim();
  const spotLabel = readParam(searchParams.label)?.trim();
  const nRaw = readParam(searchParams.n);
  const spotNumber = Number(nRaw);

  if (!orgName || !spotLabel || !Number.isFinite(spotNumber) || spotNumber < 1) {
    return null;
  }

  const reviewUrl = readParam(searchParams.link)?.trim() ?? "";

  return {
    demo: true,
    orgId: DEMO_ORG_ID,
    orgName,
    spotId: `demo-${spotLabel}-${spotNumber}`,
    spotLabel,
    spotNumber,
    spotDisplayName: formatSpotName(spotLabel, spotNumber),
    reviewUrl,
  };
}
