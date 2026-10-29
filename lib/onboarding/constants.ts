export const BUSINESS_TYPES = [
  "Restaurant",
  "Café",
  "Bar",
  "Salon",
  "Custom",
] as const;

export const LABEL_PRESETS = [
  "Table",
  "Counter",
  "Desk",
  "Booth",
  "Room",
  "Custom",
] as const;

export const SPOT_COUNT_MIN = 1;
export const SPOT_COUNT_MAX = 50;

export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type LabelPreset = (typeof LABEL_PRESETS)[number];

export function resolveSpotLabel(
  preset: LabelPreset,
  customLabel: string,
): string {
  if (preset === "Custom") return customLabel.trim();
  return preset;
}

export function resolveBusinessType(
  preset: BusinessType,
  customType: string,
): string {
  if (preset === "Custom") return customType.trim();
  return preset;
}

export function formatSpotName(label: string, number: number): string {
  return `${label} ${number}`;
}

/** Demo-only guest URL encoded in QR placeholders (not production tokens). */
export function demoGuestFeedbackUrl(
  origin: string,
  org: string,
  label: string,
  spotNumber: number,
  reviewLink: string,
): string {
  const params = new URLSearchParams({
    org,
    label,
    n: String(spotNumber),
    demo: "1",
  });
  if (reviewLink) params.set("link", reviewLink);
  return `${origin}/feedback/demo?${params.toString()}`;
}
