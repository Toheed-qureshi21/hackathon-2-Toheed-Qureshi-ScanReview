"use client";

import { Button } from "@/components/ui/button";
import { displayFeedbackComment } from "@/lib/feedback/feedback-list-dto";
import { formatRelativeTimestamp } from "@/lib/feedback/relative-timestamp";
import type { DashboardFeedbackItem } from "@/types/feedback";

type RecentFeedbackPanelProps = {
  items: DashboardFeedbackItem[];
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  hasSearch?: boolean;
  /** When false, omit the in-panel title (page provides its own heading). */
  showTitle?: boolean;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="dash-fb-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden="true">
          {i < rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

export function RecentFeedbackPanel({
  items,
  loading = false,
  errorMessage = null,
  onRetry,
  hasSearch = false,
  showTitle = true,
}: RecentFeedbackPanelProps) {
  return (
    <section
      id="feedback"
      className="dash-feedback-panel panel"
      aria-labelledby="dash-feedback-title"
    >
      {showTitle ? (
        <div className="panel-head">
          <div>
            <h2 id="dash-feedback-title" className="panel-title">
              Recent guest feedback
            </h2>
            <p className="panel-subtitle">
              Newest ratings for your workspace.
            </p>
          </div>
        </div>
      ) : (
        <h2 id="dash-feedback-title" className="sr-only">
          Recent guest feedback list
        </h2>
      )}
      <div className="dash-feedback-body">
        {loading ? (
          <p className="hint dash-feedback-state">Loading feedback…</p>
        ) : errorMessage ? (
          <div className="dash-feedback-empty" role="alert">
            <strong>Unable to load feedback</strong>
            <p className="err">{errorMessage}</p>
            {onRetry ? (
              <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
                Try again
              </Button>
            ) : null}
          </div>
        ) : items.length === 0 ? (
          <div className="dash-feedback-empty" role="status">
            {hasSearch ? (
              <>
                <strong>No matching feedback</strong>
                <p className="hint">
                  Try another search or clear the top bar search.
                </p>
              </>
            ) : (
              <>
                <strong>No feedback yet</strong>
                <p className="hint">
                  Guest ratings for your spots will appear here.
                </p>
              </>
            )}
          </div>
        ) : (
          <ul className="dash-feedback-list">
            {items.map((item) => (
              <li key={item.id}>
                <div className="dash-feedback-row">
                  <Stars rating={item.rating} />
                  <div className="dash-feedback-copy">
                    <p className="dash-feedback-spot">
                      <strong>{item.spotDisplayName}</strong>
                      <span className="hint"> · {item.spotLabel}</span>
                    </p>
                    <p className="dash-feedback-comment">
                      {displayFeedbackComment(item.comment)}
                    </p>
                  </div>
                  <time
                    className="dash-feedback-time hint"
                    dateTime={item.createdAt}
                  >
                    {formatRelativeTimestamp(item.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
