"use client";

import { demoGuestFeedbackPath } from "@/lib/onboarding/constants";
import type { MockOrg, MockQrSpot } from "@/lib/mocks/dashboard";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function demoQrPayload(org: MockOrg, spot: MockQrSpot): string {
  const path = demoGuestFeedbackPath(
    org.name,
    spot.spotLabel,
    spot.spotNumber,
    org.reviewUrl,
  );
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://demo.local";
  return `${origin}${path}`;
}

export async function generateDemoQrDataUrl(
  org: MockOrg,
  spot: MockQrSpot,
  size: number,
): Promise<string> {
  return QRCode.toDataURL(demoQrPayload(org, spot), {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#12142b", light: "#ffffff" },
  });
}

type QrCodeVisualProps = {
  org: MockOrg;
  spot: MockQrSpot;
  size?: number;
  className?: string;
  label?: string;
};

export function QrCodeVisual({
  org,
  spot,
  size = 132,
  className,
  label = "Demo QR code",
}: QrCodeVisualProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(demoQrPayload(org, spot), {
      width: size,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#12142b", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) {
          setFailed(false);
          setDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [org, spot, size]);

  if (failed) {
    return (
      <div className={`qr-code-visual qr-code-visual--error ${className ?? ""}`}>
        <p className="hint">Demo QR preview unavailable.</p>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`qr-code-visual qr-code-visual--loading ${className ?? ""}`}
        aria-busy="true"
        aria-label="Generating demo QR code"
      >
        <span className="hint">…</span>
      </div>
    );
  }

  return (
    <div className={`qr-code-visual ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- QR data URL */}
      <img src={dataUrl} alt={label} width={size} height={size} />
    </div>
  );
}
