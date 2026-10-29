import { DashboardHome } from "@/components/dashboard/dashboard-home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Code Manager · ScanReview",
  description:
    "Manage demo QR codes and preview guest feedback for your workspace.",
};

export default function DashboardPage() {
  return <DashboardHome />;
}
