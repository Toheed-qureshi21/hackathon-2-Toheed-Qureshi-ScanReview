"use client";

import type { OnboardingSpotDto } from "@/types/organization-onboarding";
import Link from "next/link";

type OnboardingQrGridProps = {
  spots: OnboardingSpotDto[];
};

function QrCard({
  spot,
  delayMs,
}: {
  spot: OnboardingSpotDto;
  delayMs: number;
}) {
  return (
    <div className="q" style={{ animationDelay: `${delayMs}ms` }}>
      <Link
        className="q-code q-code--link"
        href={spot.publicFeedbackPath}
        title="Open guest feedback page"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- public Storage URL from onboarding */}
        <img
          src={spot.qrImageUrl}
          alt={`QR code for ${spot.displayName}`}
          width={120}
          height={120}
        />
      </Link>
      <span className="q-cta">Scan and rate us</span>
      <b className="q-spot">{spot.displayName}</b>
      <a
        className="hint noprint onboarding-qr-download"
        href={spot.qrImageUrl}
        download={`${spot.displayName.replace(/\s+/g, "-")}-qr.png`}
      >
        Download PNG
      </a>
    </div>
  );
}

export function OnboardingQrGrid({ spots }: OnboardingQrGridProps) {
  return (
    <div className="qrs">
      {spots.map((spot) => (
        <QrCard
          key={spot.id}
          spot={spot}
          delayMs={Math.min(spot.number, 24) * 30}
        />
      ))}
    </div>
  );
}
