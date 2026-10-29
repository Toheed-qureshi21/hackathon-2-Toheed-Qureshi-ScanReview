import { AuthCredentialsForm } from "@/components/auth/auth-credentials-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Create your account | ScanReview",
  description: "Set up your business in about a minute.",
};

function SignupFallback() {
  return <p className="hint">Loading…</p>;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <AuthCredentialsForm mode="signup" />
    </Suspense>
  );
}
