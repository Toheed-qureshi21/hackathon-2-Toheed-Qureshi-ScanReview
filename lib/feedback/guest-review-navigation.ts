import type { GuestFeedbackContext } from "@/lib/mocks/guest-feedback";

export function buildGuestFeedbackHref(ctx: GuestFeedbackContext): string {
  if (ctx.demo) {
    const params = new URLSearchParams({
      org: ctx.orgName,
      label: ctx.spotLabel,
      n: String(ctx.spotNumber),
      demo: "1",
    });
    if (ctx.reviewUrl) params.set("link", ctx.reviewUrl);
    return `/feedback/demo?${params.toString()}`;
  }
  return `/feedback/${encodeURIComponent(ctx.orgId)}/${encodeURIComponent(ctx.spotId)}`;
}

/** Build review handoff URL — rating only (no contact details in query). */
export function buildGuestReviewHref(
  ctx: GuestFeedbackContext,
  rating: number,
  options?: { comment?: string },
): string {
  const params = new URLSearchParams({
    rating: String(rating),
    org: ctx.orgName,
    label: ctx.spotLabel,
    n: String(ctx.spotNumber),
  });

  if (ctx.demo) params.set("demo", "1");
  if (ctx.reviewUrl) params.set("link", ctx.reviewUrl);

  const comment = options?.comment?.trim();
  if (comment) params.set("note", comment.slice(0, 300));

  if (ctx.demo) {
    return `/feedback/demo/review?${params.toString()}`;
  }

  return `/feedback/${encodeURIComponent(ctx.orgId)}/${encodeURIComponent(ctx.spotId)}/review?${params.toString()}`;
}
