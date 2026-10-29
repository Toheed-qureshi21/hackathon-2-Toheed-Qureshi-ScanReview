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
    assert.equal(data.user.id, "user-1");
  });

  it("returns membership summary when member exists", () => {
    const data = buildAuthMeData(baseUser, {
      id: "mem-1",
      role: "ADMIN",
      organization: { id: "org-1", name: "Bloom & Birch Café" },
    });
    assert.equal(data.onboardingRequired, false);
    assert.deepEqual(data.membership?.organization.name, "Bloom & Birch Café");
    assert.equal(data.membership?.role, "ADMIN");
  });
});
