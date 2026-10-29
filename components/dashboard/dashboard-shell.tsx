import { BrandLink } from "@/components/ui/brand-link";
import Link from "next/link";
import type { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
};

/** Minimal dashboard chrome for UI-first flows (full dashboard in Phase 5). */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="dashboard-app">
      <aside className="dashboard-sidebar noprint" aria-label="Dashboard">
        <BrandLink href="/" className="dashboard-brand" label="ScanReview home" />
        <p className="dashboard-sidebar-label">Setup</p>
        <nav className="dashboard-nav" aria-label="Dashboard sections">
          <Link href="/dashboard/onboarding" className="dashboard-nav-link active">
            Business onboarding
          </Link>
        </nav>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-topbar noprint">
          <p className="dashboard-breadcrumb">
            Dashboard <span aria-hidden="true">/</span>{" "}
            <strong>Onboarding</strong>
          </p>
        </header>
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
