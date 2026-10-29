import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set up your business | ScanReview",
  description:
    "Configure your business, spot labels, and printable QR codes in about a minute.",
};

export default function DashboardOnboardingPage() {
  return (
    <div className="ob">
      <OnboardingWizard />
    </div>
  );
}
