import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveAuthConfirmRedirect } from "@/lib/auth/confirm-redirect";
import { authConfirmQuerySchema } from "@/lib/validations/manager-invite";

describe("authConfirmQuerySchema", () => {
  it("accepts invite and signup confirmation types", () => {
    assert.equal(
      authConfirmQuerySchema.safeParse({
        token_hash: "abc123",
        type: "invite",
      }).success,
      true,
    );
    assert.equal(
      authConfirmQuerySchema.safeParse({
        token_hash: "abc123",
        type: "signup",
      }).success,
      true,
    );
    assert.equal(
      authConfirmQuerySchema.safeParse({
        token_hash: "abc123",
        type: "email",
      }).success,
      true,
    );
  });

  it("rejects missing, empty, or oversized token hashes", () => {
    assert.equal(
      authConfirmQuerySchema.safeParse({ type: "invite" }).success,
      false,
    );
    assert.equal(
      authConfirmQuerySchema.safeParse({
        token_hash: "",
        type: "invite",
      }).success,
      false,
    );
    assert.equal(
      authConfirmQuerySchema.safeParse({
        token_hash: "x".repeat(513),
        type: "invite",
      }).success,
      false,
    );
  });

  it("rejects unknown types", () => {
    assert.equal(
      authConfirmQuerySchema.safeParse({
        token_hash: "abc123",
        type: "not-a-type",
      }).success,
      false,
    );
  });
});

describe("resolveAuthConfirmRedirect", () => {
  it("sends verified invitations to accept-invite and does not create membership", () => {
    assert.deepEqual(
      resolveAuthConfirmRedirect({ ok: true, type: "invite" }),
      { pathname: "/accept-invite", error: false },
    );
  });

  it("sends verified signup/email confirmation to login", () => {
    assert.deepEqual(
      resolveAuthConfirmRedirect({ ok: true, type: "signup" }),
      { pathname: "/auth/login", error: false },
    );
    assert.deepEqual(
      resolveAuthConfirmRedirect({ ok: true, type: "email" }),
      { pathname: "/auth/login", error: false },
    );
  });

  it("handles invalid, expired, tampered, and reused invite links", () => {
    assert.deepEqual(
      resolveAuthConfirmRedirect({ ok: false, type: "invite" }),
      { pathname: "/accept-invite", error: true },
    );
  });

  it("handles failed signup confirmation without sending the user to accept-invite", () => {
    assert.deepEqual(
      resolveAuthConfirmRedirect({ ok: false, type: "signup" }),
      { pathname: "/auth/login", error: true },
    );
  });
});
