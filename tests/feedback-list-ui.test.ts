import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveFeedbackListView } from "@/lib/feedback/feedback-list-view";
import { formatRelativeTimestamp } from "@/lib/feedback/relative-timestamp";

const now = Date.parse("2026-10-29T12:00:00.000Z");

describe("formatRelativeTimestamp", () => {
  it("formats ISO timestamps relative to now", () => {
    assert.equal(
      formatRelativeTimestamp("2026-10-29T11:56:00.000Z", now),
      "4 min ago",
    );
    assert.equal(
      formatRelativeTimestamp("2026-10-29T11:00:00.000Z", now),
      "1 hr ago",
    );
    assert.equal(
      formatRelativeTimestamp("2026-10-28T12:00:00.000Z", now),
      "Yesterday",
    );
    assert.equal(formatRelativeTimestamp("not-a-date", now), "");
  });
});

describe("resolveFeedbackListView", () => {
  const base = {
    userLoading: false,
    userError: false,
    hasMembership: true,
    isLoading: false,
    isError: false,
    itemCount: 2,
    hasSearch: false,
  };

  it("shows loading while the user or list query is pending", () => {
    assert.equal(
      resolveFeedbackListView({ ...base, userLoading: true }),
      "loading",
    );
    assert.equal(
      resolveFeedbackListView({ ...base, isLoading: true, itemCount: 0 }),
      "loading",
    );
  });

  it("shows error when the user or list query fails", () => {
    assert.equal(
      resolveFeedbackListView({ ...base, userError: true }),
      "error",
    );
    assert.equal(
      resolveFeedbackListView({ ...base, isError: true }),
      "error",
    );
  });

  it("prompts onboarding when the signed-in user has no membership", () => {
    assert.equal(
      resolveFeedbackListView({ ...base, hasMembership: false, itemCount: 0 }),
      "onboarding",
    );
  });

  it("distinguishes empty results from empty search results", () => {
    assert.equal(
      resolveFeedbackListView({ ...base, itemCount: 0 }),
      "empty",
    );
    assert.equal(
      resolveFeedbackListView({
        ...base,
        itemCount: 0,
        hasSearch: true,
      }),
      "empty-search",
    );
  });

  it("shows the list when items are present", () => {
    assert.equal(resolveFeedbackListView(base), "ready");
  });
});
