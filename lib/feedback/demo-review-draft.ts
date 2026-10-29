/**
 * Deterministic local draft text for the review drafter (UI phase).
 * Mirrors the template logic in scanreview-design/review.html — not Gemini or any API.
 */

export const REVIEW_HIGHLIGHT_KEYS = [
  "Food",
  "Service",
  "Atmosphere",
  "Speed",
  "Value",
  "Cleanliness",
] as const;

export type ReviewHighlightKey = (typeof REVIEW_HIGHLIGHT_KEYS)[number];

const HIGHLIGHT_PHRASES: Record<
  ReviewHighlightKey,
  [string, string, string]
> = {
  Food: [
    "the food was delicious",
    "the food was decent",
    "the food let me down",
  ],
  Service: [
    "the service was warm and attentive",
    "the service was fine",
    "the service could have been better",
  ],
  Atmosphere: [
    "the atmosphere was lovely",
    "the atmosphere was pleasant enough",
    "the atmosphere was not what I expected",
  ],
  Speed: [
    "everything came out quickly",
    "the wait was reasonable",
    "the wait was longer than it should have been",
  ],
  Value: [
    "it felt like great value",
    "the prices felt fair",
    "it did not feel like good value",
  ],
  Cleanliness: [
    "the place was spotless",
    "the place was reasonably clean",
    "cleanliness needs attention",
  ],
};

function toneIndex(rating: number): 0 | 1 | 2 {
  if (rating >= 4) return 0;
  if (rating === 3) return 1;
  return 2;
}

function joinPhrases(phrases: string[]): string {
  if (phrases.length === 0) return "";
  if (phrases.length === 1) return phrases[0];
  return `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
}

export type ComposeDemoDraftInput = {
  orgName: string;
  rating: number;
  picks: ReviewHighlightKey[];
  extraComment: string;
  /** Increments on each generate/rewrite for opening/closing variety. */
  variant: number;
};

/** Build a plausible review paragraph from rating, chip picks, and optional comment. */
export function composeDemoReviewDraft(input: ComposeDemoDraftInput): string {
  const org = input.orgName.trim() || "this restaurant";
  const t = toneIndex(Math.min(5, Math.max(1, input.rating)));
  const v = input.variant;

  const openings: [string, string][] = [
    [`I had a wonderful visit to ${org}.`, `My visit to ${org} was a real treat.`],
    [`My visit to ${org} was okay overall.`, `I stopped by ${org} and had a mixed experience.`],
    [`My visit to ${org} did not go as I hoped.`, `I was disappointed with my visit to ${org}.`],
  ];

  const closings: [string, string][] = [
    ["I'd happily come back.", "I'd recommend it."],
    ["There is potential here.", "I may give it another try."],
    ["I hope the team can improve.", "I'm sharing this so it can get better."],
  ];

  const pickPhrases = input.picks.map((key) => HIGHLIGHT_PHRASES[key][t]);
  let body = openings[t][v % 2];

  if (pickPhrases.length > 0) {
    const joined = joinPhrases(pickPhrases);
    const sentence =
      joined.charAt(0).toUpperCase() + joined.slice(1) + ".";
    body += ` ${sentence}`;
  }

  const extra = input.extraComment.trim();
  if (extra) {
    body += ` ${extra}${/[.!?]$/.test(extra) ? "" : "."}`;
  }

  body += ` ${closings[t][v % 2]}`;
  return body;
}
