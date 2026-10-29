import { ThemeToggle } from "@/components/landing/theme-toggle";
import { SkipToContent } from "@/components/ui/skip-link";
import { Star } from "lucide-react";
import Link from "next/link";

export function GuestFeedbackHeader() {
  return (
    <header className="guest-top wrap">
      <SkipToContent />
      <Link href="/" className="brand guest-brand">
        <span className="mark guest-mark" aria-hidden="true">
          <Star strokeWidth={1.75} fill="currentColor" aria-hidden="true" />
        </span>
        <span className="brand-app">ScanReview</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}
