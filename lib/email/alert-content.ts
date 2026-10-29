import { escapeHtml } from "@/lib/email/html";

export type LowRatingAlertContentInput = {
  organizationName: string;
  spotDisplayName: string;
  rating: number;
  createdAt: Date;
  comment: string | null;
};

export type LowRatingAlertContent = {
  subject: string;
  text: string;
  html: string;
};

export function buildLowRatingAlertContent(
  input: LowRatingAlertContentInput,
): LowRatingAlertContent {
  const when = input.createdAt.toISOString();
  const subject = `Low rating (${input.rating}/5) at ${input.organizationName} — ${input.spotDisplayName}`;

  const commentLine = input.comment?.trim()
    ? `Comment: ${input.comment.trim()}`
    : "No comment was left.";

  const text = [
    `${input.organizationName} received a ${input.rating}-star rating.`,
    `Spot: ${input.spotDisplayName}`,
    `Rating: ${input.rating} / 5`,
    `Time (UTC): ${when}`,
    commentLine,
    "",
    "This alert does not include guest contact details.",
  ].join("\n");

  const commentHtml = input.comment?.trim()
    ? `<p><strong>Comment:</strong> ${escapeHtml(input.comment.trim())}</p>`
    : "<p>No comment was left.</p>";

  const html = [
    `<p><strong>${escapeHtml(input.organizationName)}</strong> received a ${input.rating}-star rating.</p>`,
    `<p><strong>Spot:</strong> ${escapeHtml(input.spotDisplayName)}</p>`,
    `<p><strong>Rating:</strong> ${input.rating} / 5</p>`,
    `<p><strong>Time (UTC):</strong> ${escapeHtml(when)}</p>`,
    commentHtml,
    "<p>This alert does not include guest contact details.</p>",
  ].join("");

  return { subject, text, html };
}

export function emailContainsGuestContact(
  content: LowRatingAlertContent,
  contact: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  },
): boolean {
  const haystack = `${content.subject}\n${content.text}\n${content.html}`;
  const values = [contact.name, contact.email, contact.phone]
    .map((v) => v?.trim())
    .filter((v): v is string => typeof v === "string" && v.length > 3);
  return values.some((value) => haystack.includes(value));
}
