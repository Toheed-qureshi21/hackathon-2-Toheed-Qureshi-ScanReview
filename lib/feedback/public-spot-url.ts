/** Build guest feedback paths from trusted org id + public spot token. */

export function publicSpotFeedbackPath(
  organizationId: string,
  publicToken: string,
): string {
  return `/feedback/${encodeURIComponent(organizationId)}/${encodeURIComponent(publicToken)}`;
}

export function publicSpotFeedbackUrl(
  appOrigin: string,
  organizationId: string,
  publicToken: string,
): string {
  const origin = appOrigin.replace(/\/$/, "");
  return `${origin}${publicSpotFeedbackPath(organizationId, publicToken)}`;
}
