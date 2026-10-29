import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Choose your password | ScanReview",
  description: "Set a password to finish accepting your manager invite.",
};

function AcceptInviteFallback() {
  return <p className="hint">Loading…</p>;
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteFallback />}>
      <AcceptInviteForm />
    </Suspense>
  );
}
