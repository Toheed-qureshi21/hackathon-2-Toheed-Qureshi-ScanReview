/** PRD FR-10: public review links must be well-formed https URLs. */
export function isPublicReviewUrl(url: string | undefined | null): url is string {
  if (!url) return false;
  return /^https:\/\//i.test(url.trim());
}
