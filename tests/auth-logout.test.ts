import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/query-keys";
import { isBenignLogoutFailure } from "@/lib/auth/logout";
import { clearAuthSessionQueries } from "@/lib/auth/query-cache";
import { unwrapApiEnvelope } from "@/lib/api/api-error";

describe("isBenignLogoutFailure", () => {
  it("treats missing session as idempotent logout", () => {
    assert.equal(
      isBenignLogoutFailure({ message: "Auth session missing!" }),
      true,
    );
  });

  it("treats session_not_found as idempotent logout", () => {
    assert.equal(isBenignLogoutFailure({ code: "session_not_found" }), true);
  });

  it("does not treat unknown errors as benign", () => {
    assert.equal(
      isBenignLogoutFailure({ message: "Database unavailable" }),
      false,
    );
  });
});

describe("logout API envelope", () => {
  it("accepts success payload shape", () => {
    const data = unwrapApiEnvelope<{ success: true }>(
      { data: { success: true }, error: null },
      200,
    );
    assert.equal(data.success, true);
  });
});

describe("clearAuthSessionQueries", () => {
  it("removes cached current-user query", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.auth.me, {
      user: { id: "u1", email: "a@b.com", fullName: null },
      membership: null,
      onboardingRequired: true,
    });

    clearAuthSessionQueries(queryClient);

    assert.equal(queryClient.getQueryData(queryKeys.auth.me), undefined);
  });
});
