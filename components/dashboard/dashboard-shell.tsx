"use client";

import { BrandLink } from "@/components/ui/brand-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const DESKTOP_DASHBOARD_MQ = "(min-width: 768px)";

type DashboardShellProps = {
  children: ReactNode;
};

/** Minimal dashboard chrome for UI-first flows (full dashboard in Phase 5). */
export function DashboardShell({ children }: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const drawerId = useId();

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_DASHBOARD_MQ);
    const sync = () => {
      setIsDesktop(mq.matches);
      if (mq.matches) closeDrawer();
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  const drawerBackdrop =
    mounted && drawerOpen
      ? createPortal(
          <button
            type="button"
            className="dashboard-drawer-backdrop"
            aria-label="Close menu"
            onClick={closeDrawer}
          />,
          document.body,
        )
      : null;

  return (
    <div
      className={cn("dashboard-app", drawerOpen && "dashboard-app--drawer-open")}
    >
      {drawerBackdrop}
      <aside
        id={drawerId}
        className={cn(
          "dashboard-sidebar noprint",
          drawerOpen && "dashboard-sidebar--open",
        )}
        aria-label="Dashboard"
        aria-hidden={!isDesktop && !drawerOpen ? true : undefined}
        {...(!isDesktop && !drawerOpen ? { inert: true } : {})}
      >
        <div className="dashboard-sidebar-body">
          <BrandLink href="/" className="dashboard-brand" label="ScanReview home" />
          <p className="dashboard-sidebar-label">Setup</p>
          <nav className="dashboard-nav" aria-label="Dashboard sections">
            <Link
              href="/dashboard/onboarding"
              className="dashboard-nav-link active"
              onClick={closeDrawer}
            >
              Business onboarding
            </Link>
          </nav>
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-topbar noprint">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="dashboard-menu-btn"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            aria-controls={drawerId}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            {drawerOpen ? (
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
            )}
          </Button>
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
