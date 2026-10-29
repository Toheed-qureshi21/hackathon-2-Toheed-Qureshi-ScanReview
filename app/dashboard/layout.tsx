import { DashboardSearchProvider } from "@/components/dashboard/dashboard-search-context";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardSearchProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardSearchProvider>
  );
}
