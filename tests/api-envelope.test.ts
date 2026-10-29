import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ApiClientError,
  unwrapApiEnvelope,
} from "@/lib/api/api-error";

describe("unwrapApiEnvelope", () => {
  it("returns data on success envelope", () => {
    const value = unwrapApiEnvelope<{ id: string }>(
      { data: { id: "x" }, error: null },
      200,
    );
    assert.equal(value.id, "x");
  });

  it("throws ApiClientError when envelope contains error", () => {
    assert.throws(
      () =>
        unwrapApiEnvelope(
          {
            data: null,
            error: { code: "UNAUTHENTICATED", message: "Sign in." },
          },
          401,
        ),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal(err.code, "UNAUTHENTICATED");
        assert.equal(err.status, 401);
        return true;
      },
    );
  });

  it("throws when data is missing on success status", () => {
    assert.throws(
      () => unwrapApiEnvelope({ data: null, error: null }, 200),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal(err.code, "INVALID_RESPONSE");
        return true;
      },
    );
  });
});
