import type { ReactNode } from "react";

export default function GuestFeedbackLayout({ children }: { children: ReactNode }) {
  return <div className="guest-feedback-root">{children}</div>;
}
