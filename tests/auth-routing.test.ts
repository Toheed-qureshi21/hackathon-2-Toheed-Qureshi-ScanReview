import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolvePostAuthPath } from "@/lib/auth/routing";
import type { AuthMeData } from "@/types/auth-me";

const withMembership: AuthMeData = {
  user: { id: "u1", email: "a@b.com", fullName: null },
  membership: {
    id: "m1",
    role: "ADMIN",
    organization: { id: "o1", name: "Test Org" },
  },
  onboardingRequired: false,
};

const withoutMembership: AuthMeData = {
  user: { id: "u2", email: "b@b.com", fullName: null },
  membership: null,
  onboardingRequired: true,
};

describe("resolvePostAuthPath", () => {
  it("sends new users to onboarding", () => {
    assert.equal(
      resolvePostAuthPath(withoutMembership, null),
      "/dashboard/onboarding",
    );
  });

  it("sends members to dashboard by default", () => {
    assert.equal(resolvePostAuthPath(withMembership, null), "/dashboard");
  });

  it("honors safe next param when membership exists", () => {
    assert.equal(
      resolvePostAuthPath(withMembership, "/dashboard/feedback"),
      "/dashboard/feedback",
    );
  });

  it("rejects protocol-relative next URLs", () => {
    assert.equal(
      resolvePostAuthPath(withMembership, "//evil.example"),
      "/dashboard",
    );
  });
});
