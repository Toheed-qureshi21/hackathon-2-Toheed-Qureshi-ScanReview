"use client";

import {
  demoGuestFeedbackUrl,
  formatSpotName,
} from "@/lib/onboarding/constants";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type OnboardingQrGridProps = {
  org: string;
  spotLabel: string;
  count: number;
  reviewLink: string;
};

function QrCard({
  href,
  title,
  delayMs,
}: {
  href: string;
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
    <a
      className="q"
      href={href}
      title="Preview guest page (demo route)"
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
    </a>
  );
}

export function OnboardingQrGrid({
  org,
  spotLabel,
  count,
  reviewLink,
}: OnboardingQrGridProps) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://demo.local";

  return (
    <div className="qrs">
      {Array.from({ length: count }, (_, i) => {
        const spotNumber = i + 1;
        const title = formatSpotName(spotLabel, spotNumber);
        const href = demoGuestFeedbackUrl(
          origin,
          org,
          spotLabel,
          spotNumber,
          reviewLink,
        );
        return (
          <QrCard
            key={spotNumber}
            href={href}
            title={title}
            delayMs={Math.min(spotNumber, 24) * 30}
          />
        );
      })}
    </div>
  );
}
