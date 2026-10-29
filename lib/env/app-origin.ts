import "server-only";

/** Trusted site origin for public QR URLs — never derive from request Host. */
export function getTrustedAppOrigin(): string {
  const configured =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (!configured) {
    return "http://localhost:3000";
  }

  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured.replace(/\/$/, "");
  }

  return `https://${configured.replace(/\/$/, "")}`;
}
