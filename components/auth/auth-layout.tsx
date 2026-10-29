import { SiteHeader } from "@/components/landing/site-header";
import { SkipToContent } from "@/components/ui/skip-link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type AuthLayoutProps = {
  /** Primary heading inside the card (omit when the screen supplies its own headings). */
  title?: ReactNode;
  /** Supporting copy below the title. */
  description?: ReactNode;
  /** Optional block between the header copy and main content (e.g. login/signup tabs). */
  headerAddon?: ReactNode;
  /** Form fields, sections, or full card body for multi-state screens. */
  children: ReactNode;
  /** Optional links or copy below the card. */
  footer?: ReactNode;
  className?: string;
  cardClassName?: string;
};

/**
 * Shared shell for login, signup, and accept-invite screens.
 * Presentation only — no auth business logic.
 */
export function AuthLayout({
  title,
  description,
  headerAddon,
  children,
  footer,
  className,
  cardClassName,
}: AuthLayoutProps) {
  const hasHeader = title != null || description != null;

  return (
    <div className={cn("auth-page", className)}>
      <SkipToContent />
      <SiteHeader />
      <main id="main-content" className="wrap auth" tabIndex={-1}>
        <div className={cn("card auth-card", cardClassName)}>
          {hasHeader ? (
            <header className="auth-card-header">
              {title != null ? <h1>{title}</h1> : null}
              {description != null ? (
                <p className="hint auth-lead">{description}</p>
              ) : null}
            </header>
          ) : null}
          {headerAddon}
          <div className="auth-card-body">{children}</div>
        </div>
      </main>
      {footer ? <footer className="wrap auth-footer">{footer}</footer> : null}
    </div>
  );
}
