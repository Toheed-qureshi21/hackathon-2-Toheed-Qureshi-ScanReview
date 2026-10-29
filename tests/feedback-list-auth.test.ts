import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authorizeFeedbackList } from "@/lib/auth/feedback-list-access";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";

function membership(role: "ADMIN" | "MANAGER", organizationId = ORG_A) {
  return {
    ok: true as const,
    member: { organizationId, role },
  };
}

describe("authorizeFeedbackList", () => {
  it("returns 401 for unauthenticated callers", () => {
    const access = authorizeFeedbackList({
      membership: { ok: false, reason: "unauthenticated" },
    });
    assert.equal(access.ok, false);
    if (!access.ok) {
      assert.equal(access.status, 401);
      assert.equal(access.code, "UNAUTHENTICATED");
    }
  });

  it("returns 403 when the user has no organization membership", () => {
    const access = authorizeFeedbackList({
      membership: { ok: false, reason: "no_membership" },
      requestedOrganizationId: ORG_A,
    });
    assert.equal(access.ok, false);
    if (!access.ok) {
      assert.equal(access.status, 403);
      assert.equal(access.code, "FORBIDDEN");
      assert.match(access.message, /onboarding/i);
    }
  });

  it("allows ADMIN to list their membership organization", () => {
    const access = authorizeFeedbackList({
      membership: membership("ADMIN"),
    });
    assert.equal(access.ok, true);
    if (access.ok) {
      assert.equal(access.role, "ADMIN");
      assert.equal(access.organizationId, ORG_A);
    }
  });

  it("allows MANAGER to list their membership organization", () => {
    const access = authorizeFeedbackList({
      membership: membership("MANAGER"),
    });
    assert.equal(access.ok, true);
    if (access.ok) {
      assert.equal(access.role, "MANAGER");
      assert.equal(access.organizationId, ORG_A);
    }
  });

  it("rejects a mismatched client organizationId instead of using it", () => {
    const access = authorizeFeedbackList({
      membership: membership("ADMIN"),
      requestedOrganizationId: ORG_B,
    });
    assert.equal(access.ok, false);
    if (!access.ok) {
      assert.equal(access.status, 403);
      assert.equal(access.code, "FORBIDDEN");
      assert.match(access.message, /another organization/i);
    }
  });

  it("keeps the membership organization when the requested id matches", () => {
    const access = authorizeFeedbackList({
      membership: membership("MANAGER"),
      requestedOrganizationId: ORG_A,
    });
    assert.equal(access.ok, true);
    if (access.ok) {
      assert.equal(access.organizationId, ORG_A);
      assert.notEqual(access.organizationId, ORG_B);
    }
  });

  it("denies roles outside ADMIN and MANAGER", () => {
    const access = authorizeFeedbackList({
      membership: {
        ok: true,
        member: { organizationId: ORG_A, role: "GUEST" },
      },
    });
    assert.equal(access.ok, false);
    if (!access.ok) {
      assert.equal(access.status, 403);
    }
  });
});
