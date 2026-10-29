"use client";

import { cn } from "@/lib/utils";

type DashboardToastProps = {
  message: string | null;
};

export function DashboardToast({ message }: DashboardToastProps) {
  if (!message) return null;

  return (
    <div
      className={cn("dashboard-toast", "dashboard-toast--show")}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
