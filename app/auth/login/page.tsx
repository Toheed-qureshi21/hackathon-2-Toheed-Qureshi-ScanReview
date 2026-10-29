import { AuthCredentialsForm } from "@/components/auth/auth-credentials-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in to ScanReview",
  description: "Log in to see your feedback and QR codes.",
};

export default function LoginPage() {
  return <AuthCredentialsForm mode="login" />;
}
