"use client";

import { RecentFeedbackPanel } from "@/components/dashboard/recent-feedback-panel";
import { useDashboardSearch } from "@/components/dashboard/dashboard-search-context";
import { useCurrentUser } from "@/hooks/queries/use-current-user";
import { useFeedbackList } from "@/hooks/queries/use-feedback-list";
import { ApiClientError } from "@/lib/api/api-error";
import { resolveFeedbackListView } from "@/lib/feedback/feedback-list-view";
import Link from "next/link";
import { useDeferredValue } from "react";

export function DashboardFeedbackPage() {
  const { globalSearch } = useDashboardSearch();
  const deferredSearch = useDeferredValue(globalSearch);
  const trimmedSearch = deferredSearch.trim();

  const {
    data: currentUser,
    isLoading: userLoading,
    isError: userError,
    error: userQueryError,
    refetch: refetchUser,
  } = useCurrentUser();
  const hasMembership = Boolean(currentUser?.membership);

  const feedback = useFeedbackList({
    search: trimmedSearch,
    enabled: hasMembership,
  });

  const view = resolveFeedbackListView({
    userLoading,
    userError,
    hasMembership,
    isLoading: feedback.isLoading,
    isError: feedback.isError,
    itemCount: feedback.data?.items.length ?? 0,
    hasSearch: trimmedSearch.length > 0,
  });

  const errorMessage =
    feedback.error instanceof ApiClientError
      ? feedback.error.message
      : userQueryError instanceof ApiClientError
        ? userQueryError.message
        : "Unable to load feedback.";

  function retry() {
    void refetchUser();
    void feedback.refetch();
  }

  return (
    <div className="dashboard-feedback-page">
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <i aria-hidden="true" /> GUEST FEEDBACK
          </div>
          <h1>Recent guest feedback</h1>
          <p className="subtitle">
            Newest ratings and comments from guests at your spots. Use the
            search bar above to filter this list.
          </p>
        </div>
      </section>

      {view === "onboarding" ? (
        <p className="hint" role="status">
          Complete{" "}
          <Link href="/dashboard/onboarding">business onboarding</Link> to see
          guest feedback.
        </p>
      ) : (
        <RecentFeedbackPanel
          items={feedback.data?.items ?? []}
          loading={view === "loading"}
          errorMessage={view === "error" ? errorMessage : null}
          onRetry={retry}
          hasSearch={trimmedSearch.length > 0}
          showTitle={false}
        />
      )}

      <p className="qr-disclaimer">
        Showing up to 50 most recent ratings for your workspace.
      </p>
    </div>
  );
}
