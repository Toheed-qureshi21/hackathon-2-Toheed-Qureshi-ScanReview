"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api/api-error";
import { postLogout } from "@/lib/api/auth";
import { useDashboardSearch } from "@/components/dashboard/dashboard-search-context";
import { clearAuthSessionQueries } from "@/lib/auth/query-cache";

type DashboardLogoutButtonProps = {
  onError?: (message: string) => void;
};

export function DashboardLogoutButton({ onError }: DashboardLogoutButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setGlobalSearch } = useDashboardSearch();
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await postLogout();
      setGlobalSearch("");
      clearAuthSessionQueries(queryClient);
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Could not log out. Try again.";
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  }, [onError, queryClient, router, setGlobalSearch, submitting]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="dashboard-logout-btn"
      aria-label="Log out"
      disabled={submitting}
      aria-busy={submitting}
      onClick={() => void handleLogout()}
    >
      <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
      <span className="dashboard-logout-label">
        {submitting ? "Logging out…" : "Log out"}
      </span>
    </Button>
  );
}
