import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  logDisabledEnv,
  missingKeysFromZodIssues,
} from "@/lib/env/log-missing";
import {
  MissingAppOriginError,
  disabledProductionOriginKeys,
  resolveTrustedAppOrigin,
} from "@/lib/env/trusted-origin";

describe("logDisabledEnv", () => {
  it("logs env names only, never values", () => {
    const lines: unknown[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      lines.push(args);
    };
    try {
      logDisabledEnv({
        disabled: ["APP_URL", "NEXT_PUBLIC_APP_URL"],
        message: "APP_URL must be a public https origin in production.",
      });
    } finally {
      console.error = original;
    }

    assert.equal(lines.length, 1);
    const [label, payload] = lines[0] as [string, Record<string, unknown>];
    assert.equal(label, "[env]");
    assert.deepEqual(payload.disabled, ["APP_URL", "NEXT_PUBLIC_APP_URL"]);
    assert.equal(typeof payload.message, "string");
    const serialized = JSON.stringify(lines);
    assert.equal(serialized.includes("https://"), false);
    assert.equal(serialized.includes("localhost"), false);
    assert.equal(serialized.includes("sb_secret"), false);
  });

  it("collects missing Zod field names without values", () => {
    assert.deepEqual(
      missingKeysFromZodIssues([
        { path: ["DATABASE_URL"] },
        { path: ["DATABASE_URL"] },
        { path: ["NEXT_PUBLIC_SUPABASE_URL"] },
      ]),
      ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"],
    );
  });
});

describe("disabled production origin keys", () => {
  it("lists APP_URL and NEXT_PUBLIC_APP_URL when both are unset", () => {
    assert.deepEqual(
      disabledProductionOriginKeys({ VERCEL_ENV: "production" }),
      ["APP_URL", "NEXT_PUBLIC_APP_URL"],
    );
  });

  it("lists localhost APP_URL as disabled in production", () => {
    const error = (() => {
      try {
        resolveTrustedAppOrigin({
          APP_URL: "http://localhost:3000",
          NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
          VERCEL_ENV: "production",
        });
        return null;
      } catch (caught) {
        return caught;
      }
    })();
    assert.equal(error instanceof MissingAppOriginError, true);
    if (error instanceof MissingAppOriginError) {
      assert.deepEqual(error.disabled, ["APP_URL", "NEXT_PUBLIC_APP_URL"]);
    }
  });
});
