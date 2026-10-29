"use client";

import { QrManagerView } from "@/components/dashboard/qr-manager-view";
import { useDashboardSearch } from "@/components/dashboard/dashboard-search-context";

export function DashboardHome() {
  const { globalSearch } = useDashboardSearch();
  return <QrManagerView globalSearch={globalSearch} />;
}
