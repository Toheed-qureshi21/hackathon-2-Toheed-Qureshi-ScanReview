const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,}$/;

function hostnameOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isGoogleMapsReviewUrl(raw: string): boolean {
  const host = hostnameOf(raw);
  if (!host) return false;
  return (
    host === "google.com" ||
    host.endsWith(".google.com") ||
    host === "maps.google.com" ||
    host === "goo.gl" ||
    host === "maps.app.goo.gl"
  );
}

function firstPlaceId(candidates: Array<string | null | undefined>): string | null {
  for (const value of candidates) {
    if (value && PLACE_ID_RE.test(value)) {
      return value;
    }
  }
  return null;
}

export function googlePlaceIdFromReviewUrl(raw: string): string | null {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const q = url.searchParams.get("q") ?? "";
    const fromQuery = q.match(/place_id:([A-Za-z0-9_-]+)/i)?.[1];
    const found = firstPlaceId([
      url.searchParams.get("placeid"),
      url.searchParams.get("place_id"),
      fromQuery,
    ]);
    if (found) return found;
  } catch {
    // Fall through to regex on the raw string.
  }
  const fromHref = trimmed.match(/placeid=([A-Za-z0-9_-]+)/i)?.[1];
  const fromData = trimmed.match(/!1s(ChIJ[A-Za-z0-9_-]+)/)?.[1];
  const fromChij = trimmed.match(/(ChIJ[A-Za-z0-9_-]{10,})/)?.[1];
  return firstPlaceId([fromHref, fromData, fromChij]);
}

/** Prefer Google’s write-review page when a Place ID is present. */
export function buildReviewPlatformHref(raw: string): string {
  const trimmed = raw.trim();
  const placeId = googlePlaceIdFromReviewUrl(trimmed);
  if (placeId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
  }
  return trimmed;
}

export function reviewPlatformLabel(raw: string): string {
  const host = hostnameOf(raw);
  if (!host) return "the review site";
  if (isGoogleMapsReviewUrl(raw)) return "Google Maps";
  if (host.includes("tripadvisor")) return "TripAdvisor";
  if (host.includes("yelp.")) return "Yelp";
  return "the review site";
}

export function reviewPostHint(raw: string | null): string {
  if (!raw) {
    return "Paste it on any review site you like.";
  }
  return `We copy your draft, then open ${reviewPlatformLabel(raw)}. Paste it there.`;
}
