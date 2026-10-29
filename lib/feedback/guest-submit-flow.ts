export function isLowRating(rating: number): boolean {
  return rating >= 1 && rating <= 2;
}

export function isHighRating(rating: number): boolean {
  return rating >= 3 && rating <= 5;
}

/** Demo marketing URLs must never call public persist APIs. */
export function shouldPersistGuestRating(demo: boolean): boolean {
  return !demo;
}

/** Demo marketing URLs must never call Gemini. Use local templates instead. */
export function shouldGenerateReviewDraftLocally(demo: boolean): boolean {
  return demo;
}
