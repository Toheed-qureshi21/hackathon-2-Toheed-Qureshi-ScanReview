import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertOrganizationMatchesMembership,
  OrganizationAccessDeniedError,
} from "@/lib/auth/organization-access";

describe("assertOrganizationMatchesMembership", () => {
  it("allows when client omits organization id", () => {
    assert.doesNotThrow(() =>
      assertOrganizationMatchesMembership("org-a", undefined),
    );
  });

  it("allows matching organization id", () => {
    assert.doesNotThrow(() =>
      assertOrganizationMatchesMembership("org-a", "org-a"),
    );
  });

  it("denies cross-organization access", () => {
    assert.throws(
      () => assertOrganizationMatchesMembership("org-a", "org-b"),
      OrganizationAccessDeniedError,
    );
  });
});
