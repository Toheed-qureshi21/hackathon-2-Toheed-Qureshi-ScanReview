import { AuthCredentialsForm } from "@/components/auth/auth-credentials-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Log in to ScanReview",
  description: "Log in to see your feedback and QR codes.",
};

function LoginFallback() {
  return <p className="hint">Loading…</p>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <AuthCredentialsForm mode="login" />
    </Suspense>
  );
}
