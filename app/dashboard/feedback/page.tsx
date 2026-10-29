import { DashboardFeedbackPage } from "@/components/dashboard/dashboard-feedback-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guest feedback · ScanReview",
  description: "Recent guest ratings and comments for your workspace.",
};

export default function DashboardFeedbackRoute() {
  return <DashboardFeedbackPage />;
}
