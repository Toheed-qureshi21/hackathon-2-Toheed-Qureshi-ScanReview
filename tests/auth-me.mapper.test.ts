import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAuthMeData, mapSupabaseUser } from "@/lib/auth/me-mapper";

describe("mapSupabaseUser", () => {
  it("reads full_name from user metadata", () => {
    const user = mapSupabaseUser({
      id: "user-1",
      email: "a@example.com",
      user_metadata: { full_name: "Alex Morgan" },
    });
    assert.equal(user.fullName, "Alex Morgan");
    assert.equal(user.email, "a@example.com");
  });
});

describe("buildAuthMeData", () => {
  const baseUser = {
    id: "user-1",
    email: "owner@cafe.test",
    user_metadata: { full_name: "Owner" },
  };

  it("returns onboardingRequired when membership is missing", () => {
    const data = buildAuthMeData(baseUser, null);
    assert.equal(data.membership, null);
    assert.equal(data.onboardingRequired, true);
    assert.equal(data.pendingManagerInvite, false);
    assert.equal(data.user.id, "user-1");
  });

  it("returns membership summary when member exists", () => {
    const data = buildAuthMeData(baseUser, {
      id: "mem-1",
      role: "ADMIN",
      organization: { id: "org-1", name: "Bloom & Birch Café" },
    });
    assert.equal(data.onboardingRequired, false);
    assert.equal(data.pendingManagerInvite, false);
    assert.deepEqual(data.membership?.organization.name, "Bloom & Birch Café");
    assert.equal(data.membership?.role, "ADMIN");
  });

  it("flags a pending manager invite from app_metadata without exposing org ids", () => {
    const data = buildAuthMeData(
      {
        ...baseUser,
        email: "manager@cafe.test",
        app_metadata: {
          organizationId: "11111111-1111-4111-8111-111111111111",
          role: "MANAGER",
        },
        user_metadata: { organizationId: "evil-org", role: "ADMIN" },
      },
      null,
    );
    assert.equal(data.pendingManagerInvite, true);
    assert.equal(data.onboardingRequired, false);
    assert.equal(data.membership, null);
    assert.equal(JSON.stringify(data).includes("evil-org"), false);
    assert.equal(
      JSON.stringify(data).includes("11111111-1111-4111-8111-111111111111"),
      false,
    );
  });
});
