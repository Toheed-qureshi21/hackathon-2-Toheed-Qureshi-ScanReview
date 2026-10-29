"use client";

import { RecentFeedbackPanel } from "@/components/dashboard/recent-feedback-panel";
import { useDashboardSearch } from "@/components/dashboard/dashboard-search-context";
import { mockRecentFeedback } from "@/lib/mocks/dashboard";
import { useEffect, useState } from "react";

export function DashboardFeedbackPage() {
  const { globalSearch } = useDashboardSearch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="dashboard-feedback-page">
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <i aria-hidden="true" /> GUEST FEEDBACK
          </div>
          <h1>Recent guest feedback</h1>
          <p className="subtitle">
            See ratings and comments from demo scans. Use the search bar above
            to filter this list.
          </p>
        </div>
      </section>

      <RecentFeedbackPanel
        items={mockRecentFeedback}
        query={globalSearch}
        loading={loading}
        showTitle={false}
      />

      <p className="qr-disclaimer">
        Dashboard preview · Sample data. Feedback shown here is illustrative
        until connected to your ScanReview backend.
      </p>
    </div>
  );
}
