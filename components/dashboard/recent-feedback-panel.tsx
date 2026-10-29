"use client";

import type { MockFeedbackItem } from "@/lib/mocks/dashboard";
type RecentFeedbackPanelProps = {
  items: MockFeedbackItem[];
  query: string;
  loading?: boolean;
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
  query,
  loading = false,
}: RecentFeedbackPanelProps) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (item) =>
          item.spotName.toLowerCase().includes(q) ||
          item.comment.toLowerCase().includes(q) ||
          String(item.rating).includes(q),
      )
    : items;

  return (
    <section
      id="feedback"
      className="dash-feedback-panel panel"
      aria-labelledby="dash-feedback-title"
    >
      <div className="panel-head">
        <div>
          <h2 id="dash-feedback-title" className="panel-title">
            Recent guest feedback
          </h2>
          <p className="panel-subtitle">
            Demo list — ratings and spot names reflect mock data only.
          </p>
        </div>
      </div>
      <div className="dash-feedback-body">
        {loading ? (
          <p className="hint dash-feedback-state">Loading preview…</p>
        ) : filtered.length === 0 ? (
          <div className="dash-feedback-empty" role="status">
            <strong>No matching feedback</strong>
            <p className="hint">Try another search or clear the top bar search.</p>
          </div>
        ) : (
          <ul className="dash-feedback-list">
            {filtered.map((item) => (
              <li key={item.id}>
                <div className="dash-feedback-row">
                  <Stars rating={item.rating} />
                  <div className="dash-feedback-copy">
                    <p className="dash-feedback-spot">
                      <strong>{item.spotName}</strong>
                      <span className="hint"> · {item.spotLabel}</span>
                    </p>
                    <p className="dash-feedback-comment">{item.comment}</p>
                  </div>
                  <time
                    className="dash-feedback-time hint"
                    dateTime={item.createdAt}
                  >
                    {item.timestampLabel}
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
