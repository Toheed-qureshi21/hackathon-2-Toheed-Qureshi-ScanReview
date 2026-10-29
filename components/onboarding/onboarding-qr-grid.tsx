"use client";

import type { OnboardingSpotDto } from "@/types/organization-onboarding";
import QRCode from "qrcode";
import Link from "next/link";
import { useEffect, useState } from "react";

type OnboardingQrGridProps = {
  spots: OnboardingSpotDto[];
};

function QrCard({
  href,
  linkHref,
  title,
  delayMs,
}: {
  href: string;
  linkHref: string;
  title: string;
  delayMs: number;
}) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(href, { width: 120, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [href]);

  return (
    <Link
      className="q"
      href={linkHref}
      title="Open guest feedback page"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="q-code">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- QR data URL from qrcode package
          <img src={dataUrl} alt="" width={120} height={120} />
        ) : (
          <span className="hint">…</span>
        )}
      </div>
      <span className="q-cta">Scan and Rate us</span>
      <b className="q-spot">{title}</b>
    </Link>
  );
}

export function OnboardingQrGrid({ spots }: OnboardingQrGridProps) {
  return (
    <div className="qrs">
      {spots.map((spot) => (
        <QrCard
          key={spot.id}
          href={spot.publicFeedbackUrl}
          linkHref={spot.publicFeedbackPath}
          title={spot.displayName}
          delayMs={Math.min(spot.number, 24) * 30}
        />
      ))}
    </div>
  );
}
