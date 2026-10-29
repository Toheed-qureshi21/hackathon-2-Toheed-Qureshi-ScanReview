import { QrManagerView } from "@/components/dashboard/qr-manager-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Code Manager · ScanReview",
  description:
    "Manage QR codes and guest feedback links for your workspace.",
};

export default function DashboardPage() {
  return <QrManagerView />;
}
