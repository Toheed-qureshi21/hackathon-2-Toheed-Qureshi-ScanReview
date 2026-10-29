"use client";

import { DashboardLogoutButton } from "@/components/dashboard/dashboard-logout-button";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { useDashboardSearch } from "@/components/dashboard/dashboard-search-context";
import { BrandLink } from "@/components/ui/brand-link";
import { Button } from "@/components/ui/button";
import { SkipToContent } from "@/components/ui/skip-link";
import { useCurrentUser } from "@/hooks/queries/use-current-user";
import {
  initialsFromLabel,
  roleLabel,
} from "@/lib/auth/display-name";
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
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const DESKTOP_DASHBOARD_MQ = "(min-width: 768px)";
const DRAWER_FOCUSABLE =
  "a[href], button:not([disabled]):not([tabindex='-1'])";

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
    label: "Dashboard",
    icon: <LayoutDashboard size={18} strokeWidth={1.75} aria-hidden />,
  },
 
  {
    href: "/dashboard/feedback",
    label: "Guest feedback",
    icon: <MessageSquare size={18} strokeWidth={1.75} aria-hidden />,
  },
  
];



function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
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
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
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

    const getItems = () =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(DRAWER_FOCUSABLE) ??
          [],
      );

    getItems()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDrawer();
        menuButtonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const items = getItems();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
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
    const active = isNavActive(pathname, item.href);
    const className = cn("dashboard-nav-link", active && "active");

    if (item.previewOnly) {
      return (
        <button
          key={item.label}
          type="button"
          className={className}
          aria-label={`${item.label} (preview only)`}
          onClick={() => {
            setNavToast(`${item.label} — preview only, not connected yet`);
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
        aria-current={active ? "page" : undefined}
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
      <SkipToContent />
      {drawerBackdrop}
      <aside
        ref={sidebarRef}
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
              setNavToast("Workspace switcher — preview only, not connected yet")
            }
          >
            <span className="sr-only">Preview only. </span>
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
        </div>
       
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-topbar noprint">
          <Button
            ref={menuButtonRef}
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
        <main id="main-content" className="dashboard-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
