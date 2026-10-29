import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encodeFeedbackCursor } from "@/lib/feedback/feedback-cursor";
import {
  displayFeedbackComment,
  toDashboardFeedbackItem,
} from "@/lib/feedback/feedback-list-dto";
import { paginateFeedbackRows } from "@/lib/feedback/feedback-list-page";
import {
  DASHBOARD_FEEDBACK_ORG_SELECT,
  DASHBOARD_FEEDBACK_SELECT,
  buildFeedbackListWhere,
} from "@/lib/feedback/feedback-list-query";
import {
  FEEDBACK_LIST_DEFAULT_LIMIT,
  FEEDBACK_SEARCH_MAX_LENGTH,
  listFeedbackQueryFromSearchParams,
  listFeedbackQuerySchema,
} from "@/lib/validations/feedback-query";
import { buildFeedbackListPath } from "@/lib/api/feedback";
import { queryKeys } from "@/hooks/queries/query-keys";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const FEEDBACK_ID = "33333333-3333-4333-8333-333333333333";
const FEEDBACK_ID_2 = "44444444-4444-4444-8444-444444444444";
const CREATED_AT = new Date("2026-10-29T10:02:00.000Z");

function parseQuery(init: string) {
  return listFeedbackQueryFromSearchParams(new URLSearchParams(init));
}

function collectKeys(
  value: unknown,
  keys = new Set<string>(),
): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, keys);
    }
    return keys;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      keys.add(key);
      collectKeys(nested, keys);
    }
  }
  return keys;
}

describe("listFeedbackQuerySchema", () => {
  it("defaults limit to 50 when omitted", () => {
    const parsed = listFeedbackQuerySchema.safeParse({});
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.limit, FEEDBACK_LIST_DEFAULT_LIMIT);
      assert.equal(parsed.data.search, undefined);
      assert.equal(parsed.data.cursor, undefined);
      assert.equal(parsed.data.organizationId, undefined);
    }
  });

  it("accepts limit boundary values 1 and 50", () => {
    assert.equal(parseQuery("limit=1").success, true);
    assert.equal(parseQuery("limit=50").success, true);
    const parsed = parseQuery("limit=1");
    if (parsed.success) {
      assert.equal(parsed.data.limit, 1);
    }
  });

  it("rejects invalid and out-of-range limits", () => {
    assert.equal(parseQuery("limit=0").success, false);
    assert.equal(parseQuery("limit=51").success, false);
    assert.equal(parseQuery("limit=abc").success, false);
    assert.equal(parseQuery("limit=1.5").success, false);
    assert.equal(parseQuery("limit=-1").success, false);
  });

  it("accepts search at the 80-character cap and rejects longer values", () => {
    assert.equal(
      listFeedbackQuerySchema.safeParse({
        search: "x".repeat(FEEDBACK_SEARCH_MAX_LENGTH),
      }).success,
      true,
    );
    assert.equal(
      listFeedbackQuerySchema.safeParse({
        search: "x".repeat(FEEDBACK_SEARCH_MAX_LENGTH + 1),
      }).success,
      false,
    );
  });

  it("treats blank search as omitted", () => {
    const parsed = listFeedbackQuerySchema.safeParse({ search: "   " });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.search, undefined);
    }
  });

  it("rejects a non-uuid organizationId", () => {
    assert.equal(
      listFeedbackQuerySchema.safeParse({ organizationId: "org-b" }).success,
      false,
    );
  });

  it("accepts a matching-shape organizationId without using it as query scope", () => {
    const parsed = listFeedbackQuerySchema.safeParse({
      organizationId: ORG_B,
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.organizationId, ORG_B);
    }
  });

  it("accepts a valid createdAt_id cursor and rejects invalid cursors", () => {
    const cursor = encodeFeedbackCursor(CREATED_AT, FEEDBACK_ID);
    assert.equal(
      listFeedbackQuerySchema.safeParse({ cursor }).success,
      true,
    );
    assert.equal(
      listFeedbackQuerySchema.safeParse({ cursor: "not-a-cursor" }).success,
      false,
    );
    assert.equal(
      listFeedbackQuerySchema.safeParse({ cursor: `${CREATED_AT.toISOString()}_nope` })
        .success,
      false,
    );
  });
});

describe("dashboard feedback DTO privacy", () => {
  it("omits contact details, tokens, and unrelated organization fields", () => {
    const dto = toDashboardFeedbackItem(
      {
        id: FEEDBACK_ID,
        rating: 2,
        comment: "Food arrived cold.",
        createdAt: CREATED_AT,
        spot: { displayName: "Table 07" },
      },
      "Table",
    );

    assert.deepEqual(Object.keys(dto).sort(), [
      "comment",
      "createdAt",
      "id",
      "rating",
      "spotDisplayName",
      "spotLabel",
    ]);
    assert.equal(dto.createdAt, "2026-10-29T10:02:00.000Z");
    assert.equal(dto.spotDisplayName, "Table 07");
    assert.equal(dto.spotLabel, "Table");

    const json = JSON.stringify(dto);
    for (const leaked of [
      "contactName",
      "contactEmail",
      "contactPhone",
      "guest@example.com",
      "555-0100",
      "publicToken",
      "publicFeedbackUrl",
      "reviewUrl",
      "alertEmail",
      "pendingManagerEmail",
    ]) {
      assert.equal(json.includes(leaked), false, leaked);
    }
  });

  it("does not copy extra contact fields even when present on the source row", () => {
    const dto = toDashboardFeedbackItem(
      {
        id: FEEDBACK_ID,
        rating: 1,
        comment: null,
        createdAt: CREATED_AT,
        spot: { displayName: "Patio 02" },
        contactName: "Ada Guest",
        contactEmail: "guest@example.com",
        contactPhone: "555-0100",
        publicToken: "secret-token",
      } as never,
      "Patio",
    );

    assert.equal("contactName" in dto, false);
    assert.equal("contactEmail" in dto, false);
    assert.equal("contactPhone" in dto, false);
    assert.equal("publicToken" in dto, false);
    assert.equal(dto.comment, null);
    assert.equal(JSON.stringify(dto).includes("guest@example.com"), false);
  });

  it("keeps nullable comments as null in the DTO", () => {
    const dto = toDashboardFeedbackItem(
      {
        id: FEEDBACK_ID,
        rating: 5,
        comment: null,
        createdAt: CREATED_AT,
        spot: { displayName: "Counter 01" },
      },
      "Counter",
    );
    assert.equal(dto.comment, null);
  });
});

describe("DASHBOARD_FEEDBACK_SELECT", () => {
  it("selects only dashboard fields from Feedback and Spot", () => {
    assert.deepEqual(Object.keys(DASHBOARD_FEEDBACK_SELECT).sort(), [
      "comment",
      "createdAt",
      "id",
      "rating",
      "spot",
    ]);
    assert.deepEqual(Object.keys(DASHBOARD_FEEDBACK_SELECT.spot.select), [
      "displayName",
    ]);
    assert.deepEqual(Object.keys(DASHBOARD_FEEDBACK_ORG_SELECT), ["spotLabel"]);

    const keys = collectKeys(DASHBOARD_FEEDBACK_SELECT);
    for (const leaked of [
      "contactName",
      "contactEmail",
      "contactPhone",
      "publicToken",
      "organizationId",
      "reviewUrl",
    ]) {
      assert.equal(keys.has(leaked), false, leaked);
    }
  });
});

describe("buildFeedbackListWhere organization isolation", () => {
  it("always scopes the query to the membership organizationId argument", () => {
    const where = buildFeedbackListWhere(ORG_A, { search: "cold" });
    assert.equal(where.organizationId, ORG_A);
    assert.notEqual(where.organizationId, ORG_B);
  });

  it("does not search contact fields", () => {
    const where = buildFeedbackListWhere(ORG_A, { search: "Ada" });
    const keys = collectKeys(where);
    for (const leaked of ["contactName", "contactEmail", "contactPhone"]) {
      assert.equal(keys.has(leaked), false, leaked);
    }
  });

  it("does not use a client organization id as the query scope", () => {
    const where = buildFeedbackListWhere(ORG_A, {
      search: ORG_B,
    });
    assert.equal(where.organizationId, ORG_A);
  });
});

describe("paginateFeedbackRows", () => {
  it("returns nextCursor only when another page exists", () => {
    const rows = [
      { id: FEEDBACK_ID, createdAt: CREATED_AT },
      {
        id: FEEDBACK_ID_2,
        createdAt: new Date("2026-10-29T09:00:00.000Z"),
      },
    ];
    const full = paginateFeedbackRows(rows, 1);
    assert.equal(full.page.length, 1);
    assert.equal(full.nextCursor, encodeFeedbackCursor(CREATED_AT, FEEDBACK_ID));

    const exact = paginateFeedbackRows(rows, 2);
    assert.equal(exact.nextCursor, null);
    assert.equal(exact.page.length, 2);

    const empty = paginateFeedbackRows([], 50);
    assert.deepEqual(empty.page, []);
    assert.equal(empty.nextCursor, null);
  });
});

describe("displayFeedbackComment", () => {
  it("returns a fallback for null and blank comments", () => {
    assert.equal(displayFeedbackComment(null), "No comment left.");
    assert.equal(displayFeedbackComment("   "), "No comment left.");
    assert.equal(displayFeedbackComment("Great espresso."), "Great espresso.");
  });
});

describe("feedback list client path", () => {
  it("does not send a client organization id", () => {
    assert.equal(buildFeedbackListPath(), "/feedback");
    assert.equal(
      buildFeedbackListPath({ search: "table 7" }),
      "/feedback?search=table+7",
    );
    assert.equal(buildFeedbackListPath({ search: "  " }), "/feedback");
    assert.equal(buildFeedbackListPath({ search: "cold" }).includes("organizationId"), false);
  });
});

describe("feedback query keys", () => {
  it("scopes list keys by search", () => {
    assert.deepEqual(queryKeys.feedback.list(), ["feedback", "list", {}]);
    assert.deepEqual(queryKeys.feedback.list({ search: "patio" }), [
      "feedback",
      "list",
      { search: "patio" },
    ]);
  });
});
