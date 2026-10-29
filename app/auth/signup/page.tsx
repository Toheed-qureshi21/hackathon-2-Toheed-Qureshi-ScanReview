import { AuthCredentialsForm } from "@/components/auth/auth-credentials-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your account | ScanReview",
  description: "Set up your business in about a minute.",
};

export default function SignupPage() {
  return <AuthCredentialsForm mode="signup" />;
}
