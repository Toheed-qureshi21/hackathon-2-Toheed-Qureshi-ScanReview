"use client";

import { DashboardLogoutButton } from "@/components/dashboard/dashboard-logout-button";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { useDashboardSearch } from "@/components/dashboard/dashboard-search-context";
import { BrandLink } from "@/components/ui/brand-link";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/queries/use-current-user";
import {
  initialsFromLabel,
  roleLabel,
} from "@/lib/auth/display-name";
import { LOW_RATING_ALERT_COUNT } from "@/lib/mocks/dashboard";
import { ApiClientError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  QrCode,
  FilePen,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const DESKTOP_DASHBOARD_MQ = "(min-width: 768px)";

type DashboardShellProps = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  previewOnly?: boolean;
};

const WORKSPACE_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: <LayoutDashboard size={18} strokeWidth={1.75} aria-hidden />,
    previewOnly: true,
  },
  {
    href: "/dashboard/feedback",
    label: "Guest feedback",
    icon: <MessageSquare size={18} strokeWidth={1.75} aria-hidden />,
    badge: LOW_RATING_ALERT_COUNT,
  },
  {
    href: "/dashboard",
    label: "Low-rating alerts",
    icon: <Bell size={18} strokeWidth={1.75} aria-hidden />,
    previewOnly: true,
  },
  {
    href: "/dashboard",
    label: "QR codes",
    icon: <QrCode size={18} strokeWidth={1.75} aria-hidden />,
  },
  {
    href: "/dashboard",
    label: "Review drafts",
    icon: <FilePen size={18} strokeWidth={1.75} aria-hidden />,
    previewOnly: true,
  },
];

const MANAGE_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Team members",
    icon: <Users size={18} strokeWidth={1.75} aria-hidden />,
    previewOnly: true,
  },
  {
    href: "/dashboard",
    label: "Settings",
    icon: <Settings size={18} strokeWidth={1.75} aria-hidden />,
    previewOnly: true,
  },
  {
    href: "/dashboard/onboarding",
    label: "Business onboarding",
    icon: <QrCode size={18} strokeWidth={1.75} aria-hidden />,
  },
];

function isNavActive(pathname: string, label: string): boolean {
  if (label === "Business onboarding") {
    return pathname.startsWith("/dashboard/onboarding");
  }
  if (label === "Guest feedback") {
    return pathname.startsWith("/dashboard/feedback");
  }
  if (label === "QR codes") {
    return pathname === "/dashboard";
  }
  return false;
}

/** Dashboard chrome aligned with scanreview-design/dashboard.html (UI-only). */
export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    data: currentUser,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();
  const { globalSearch, setGlobalSearch } = useDashboardSearch();

  useEffect(() => {
    if (userError instanceof ApiClientError && userError.status === 401) {
      router.replace("/auth/login");
    }
  }, [userError, router]);

  const workspaceName =
    currentUser?.membership?.organization.name ??
    (userLoading ? "…" : "Your business");
  const workspaceSubtitle = currentUser?.membership
    ? "Your workspace"
    : userLoading
      ? " "
      : "Complete onboarding to create your workspace";
  const workspaceInitials = initialsFromLabel(
    currentUser?.membership?.organization.name ?? "SR",
  );

  const profileName =
    currentUser?.user.fullName?.trim() ||
    currentUser?.user.email?.split("@")[0] ||
    (userLoading ? "…" : "Account");
  const profileRole = currentUser?.membership
    ? roleLabel(currentUser.membership.role)
    : "Set up your business";
  const profileInitials = initialsFromLabel(profileName);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [isDesktop, setIsDesktop] = useState(false);
  const [navToast, setNavToast] = useState<string | null>(null);
  const drawerId = useId();

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const breadcrumbPage = pathname.startsWith("/dashboard/onboarding")
    ? "Onboarding"
    : pathname.startsWith("/dashboard/feedback")
      ? "Guest feedback"
      : "QR code manager";
  const breadcrumbSection = pathname.startsWith("/dashboard/onboarding")
    ? "Setup"
    : "Workspace";

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

  useEffect(() => {
    if (!navToast) return;
    const t = window.setTimeout(() => setNavToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [navToast]);

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

  function renderNavItem(item: NavItem) {
    const active = isNavActive(pathname, item.label);
    const className = cn("dashboard-nav-link", active && "active");

    if (item.previewOnly) {
      return (
        <button
          key={item.label}
          type="button"
          className={className}
          onClick={() => {
            setNavToast(`${item.label} — demo preview only`);
            closeDrawer();
          }}
        >
          <span className="dashboard-nav-icon">{item.icon}</span>
          <span className="dashboard-nav-text">{item.label}</span>
        </button>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={className}
        onClick={closeDrawer}
      >
        <span className="dashboard-nav-icon">{item.icon}</span>
        <span className="dashboard-nav-text">{item.label}</span>
        {item.badge ? (
          <span className="dashboard-nav-badge">{item.badge}</span>
        ) : null}
      </Link>
    );
  }

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
          <button
            type="button"
            className="dashboard-workspace"
            onClick={() =>
              setNavToast("Workspace switcher — demo preview only")
            }
          >
            <span className="dashboard-avatar" aria-hidden="true">
              {userLoading ? "…" : workspaceInitials}
            </span>
            <span className="dashboard-workspace-copy">
              <strong>{userLoading ? "Loading…" : workspaceName}</strong>
              <span>{userLoading ? " " : workspaceSubtitle}</span>
            </span>
          </button>
          <p className="dashboard-sidebar-label">Workspace</p>
          <nav className="dashboard-nav" aria-label="Workspace navigation">
            {WORKSPACE_NAV.map(renderNavItem)}
          </nav>
          <p className="dashboard-sidebar-label dashboard-sidebar-label--manage">
            Manage
          </p>
          <nav className="dashboard-nav" aria-label="Manage navigation">
            {MANAGE_NAV.map(renderNavItem)}
          </nav>
        </div>
        <div className="dashboard-sidebar-bottom noprint">
          <div className="dashboard-help-card">
            <strong>Need a hand?</strong>
            <p className="hint">Get help setting up your feedback experience.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNavToast("Help center — demo preview only")}
            >
              Visit help center ↗
            </Button>
          </div>
          <div className="dashboard-profile">
            <span className="dashboard-avatar dashboard-avatar--profile">
              {userLoading ? "…" : profileInitials}
            </span>
            <div className="dashboard-workspace-copy">
              <strong>{userLoading ? "Loading…" : profileName}</strong>
              <span>{userLoading ? " " : profileRole}</span>
            </div>
          </div>
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
            {breadcrumbSection} <span aria-hidden="true">›</span>{" "}
            <strong>{breadcrumbPage}</strong>
          </p>
          <div className="dashboard-top-actions">
            <label className="dashboard-search">
              <span className="sr-only">Search feedback</span>
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search feedback…"
              />
            </label>
            <ThemeToggle />
            <DashboardLogoutButton
              onError={(message) => setNavToast(message)}
            />
          </div>
        </header>
        {navToast ? (
          <p className="dashboard-nav-toast hint" role="status">
            {navToast}
          </p>
        ) : null}
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
