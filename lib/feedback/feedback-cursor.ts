const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export type FeedbackListCursor = {
  createdAt: Date;
  id: string;
};

/** Opaque `createdAt_id` cursor using existing Feedback fields. */
export function encodeFeedbackCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}_${id}`;
}

export function decodeFeedbackCursor(raw: string): FeedbackListCursor | null {
  const idx = raw.lastIndexOf("_");
  if (idx <= 0) {
    return null;
  }
  const iso = raw.slice(0, idx);
  const id = raw.slice(idx + 1);
  if (!ISO_RE.test(iso) || !UUID_RE.test(id)) {
    return null;
  }
  const createdAt = new Date(iso);
  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }
  return { createdAt, id };
}
