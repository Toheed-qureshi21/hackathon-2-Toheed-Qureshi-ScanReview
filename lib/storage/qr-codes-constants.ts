/** Public Supabase Storage bucket for printable spot QR PNGs (no private data). */

export const QR_CODES_BUCKET = "scanreview-qr-codes";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function spotQrStoragePath(
  organizationId: string,
  spotId: string,
): string {
  if (!UUID_RE.test(organizationId) || !UUID_RE.test(spotId)) {
    throw new Error("Invalid organization or spot id for QR storage path.");
  }
  return `organizations/${organizationId}/spots/${spotId}.png`;
}

/** Public object URL for a file in the QR bucket (not a signed URL). */
export function publicQrImageUrl(
  supabaseProjectUrl: string,
  storagePath: string,
): string {
  const base = supabaseProjectUrl.replace(/\/$/, "");
  const encodedPath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${QR_CODES_BUCKET}/${encodedPath}`;
}

export const QR_PNG_CONTENT_TYPE = "image/png";
