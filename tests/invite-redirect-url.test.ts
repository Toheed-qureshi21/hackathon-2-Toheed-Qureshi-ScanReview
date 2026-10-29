import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  AUTH_CONFIRM_PATH,
  MissingAppOriginError,
  joinOriginPath,
  originContainsLocalhost,
  resolveAuthConfirmRedirectUrl,
  resolveTrustedAppOrigin,
} from "@/lib/env/trusted-origin";

const PRODUCTION_ORIGIN = "https://scanreview.vercel.app";
const PRODUCTION_CONFIRM_URL = `${PRODUCTION_ORIGIN}${AUTH_CONFIRM_PATH}`;
const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

describe("manager invite redirect URL (mocked Auth; no live email)", () => {
  it("uses APP_URL https://scanreview.vercel.app and /auth/confirm", () => {
    const redirectTo = resolveAuthConfirmRedirectUrl({
      APP_URL: PRODUCTION_ORIGIN,
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      VERCEL_ENV: "production",
      NODE_ENV: "production",
    });

    assert.equal(redirectTo, PRODUCTION_CONFIRM_URL);
    assert.equal(originContainsLocalhost(redirectTo), false);
    assert.equal(new URL(redirectTo).pathname, AUTH_CONFIRM_PATH);
    assert.doesNotMatch(new URL(redirectTo).pathname, /\/\//);
  });

  it("falls back to NEXT_PUBLIC_APP_URL when APP_URL is empty", () => {
    const redirectTo = resolveAuthConfirmRedirectUrl({
      APP_URL: "  ",
      NEXT_PUBLIC_APP_URL: `${PRODUCTION_ORIGIN}/`,
      VERCEL_ENV: "production",
      NODE_ENV: "production",
    });
    assert.equal(redirectTo, PRODUCTION_CONFIRM_URL);
  });

  it("does not introduce duplicate slashes from a trailing APP_URL slash", () => {
    assert.equal(
      joinOriginPath("https://scanreview.vercel.app/", "/auth/confirm"),
      PRODUCTION_CONFIRM_URL,
    );
    assert.equal(
      resolveAuthConfirmRedirectUrl({
        APP_URL: "https://scanreview.vercel.app/",
        VERCEL_ENV: "production",
      }),
      PRODUCTION_CONFIRM_URL,
    );
  });

  it("fails closed when production APP_URL is missing", () => {
    assert.throws(
      () =>
        resolveTrustedAppOrigin({
          VERCEL_ENV: "production",
          NODE_ENV: "production",
        }),
      (error: unknown) => {
        assert.equal(error instanceof MissingAppOriginError, true);
        if (error instanceof MissingAppOriginError) {
          assert.deepEqual(error.disabled, [
            "APP_URL",
            "NEXT_PUBLIC_APP_URL",
          ]);
        }
        return true;
      },
    );
  });

  it("fails closed when production APP_URL is localhost or 127.0.0.1", () => {
    assert.throws(
      () =>
        resolveAuthConfirmRedirectUrl({
          APP_URL: "http://localhost:3000",
          VERCEL_ENV: "production",
          NODE_ENV: "production",
        }),
      MissingAppOriginError,
    );
    assert.throws(
      () =>
        resolveAuthConfirmRedirectUrl({
          APP_URL: "http://127.0.0.1:3000",
          NODE_ENV: "production",
        }),
      MissingAppOriginError,
    );
  });

  it("fails closed when production APP_URL is not https", () => {
    assert.throws(
      () =>
        resolveTrustedAppOrigin({
          APP_URL: "http://scanreview.vercel.app",
          VERCEL_ENV: "production",
        }),
      MissingAppOriginError,
    );
  });

  it("allows localhost only outside production", () => {
    assert.equal(
      resolveTrustedAppOrigin({ NODE_ENV: "development" }),
      "http://localhost:3000",
    );
    assert.equal(
      resolveAuthConfirmRedirectUrl({
        APP_URL: "http://localhost:3000",
        NODE_ENV: "development",
      }),
      "http://localhost:3000/auth/confirm",
    );
  });

  it("does not use VERCEL_URL instead of a missing production APP_URL", () => {
    assert.throws(
      () =>
        resolveTrustedAppOrigin({
          VERCEL_URL: "scanreview.vercel.app",
          VERCEL_ENV: "production",
          NODE_ENV: "production",
        }),
      MissingAppOriginError,
    );
  });

  it("onboarding and retry both send invites through inviteManagerForOrganization", () => {
    const onboarding = readFileSync(
      join(ROOT, "lib/services/organizations-onboarding.ts"),
      "utf8",
    );
    const retryRoute = readFileSync(
      join(ROOT, "app/api/invites/manager/route.ts"),
      "utf8",
    );
    const inviteService = readFileSync(
      join(ROOT, "lib/services/manager-invite.ts"),
      "utf8",
    );

    assert.match(onboarding, /inviteManagerForOrganization/);
    assert.match(retryRoute, /inviteManagerForOrganization/);
    assert.match(inviteService, /getAuthConfirmRedirectUrl/);
    assert.doesNotMatch(inviteService, /request\.headers|headers\.get\(/);
  });
});
