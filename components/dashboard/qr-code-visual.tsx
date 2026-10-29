type StoredQrImageProps = {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
};

/** Renders a persisted QR PNG from Supabase Storage (no client-side regeneration). */
export function StoredQrImage({
  src,
  alt,
  size = 132,
  className,
}: StoredQrImageProps) {
  if (!src) {
    return (
      <div
        className={`qr-code-visual qr-code-visual--error ${className ?? ""}`}
        role="status"
      >
        <p className="hint">QR image not available for this spot.</p>
      </div>
    );
  }

  return (
    <div className={`qr-code-visual ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- public Storage URL */}
      <img src={src} alt={alt} width={size} height={size} />
    </div>
  );
}
