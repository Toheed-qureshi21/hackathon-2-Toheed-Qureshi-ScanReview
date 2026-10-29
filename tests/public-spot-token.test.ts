import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { publicSpotFeedbackPath } from "@/lib/feedback/public-spot-url";
import {
  generatePublicSpotToken,
  isValidPublicSpotTokenFormat,
} from "@/lib/spots/public-token";

describe("generatePublicSpotToken", () => {
  it("generates unique URL-safe tokens", () => {
    const a = generatePublicSpotToken();
    const b = generatePublicSpotToken();
    assert.notEqual(a, b);
    assert.equal(isValidPublicSpotTokenFormat(a), true);
    assert.equal(isValidPublicSpotTokenFormat(b), true);
  });
});

describe("publicSpotFeedbackPath", () => {
  it("builds feedback path with org id and token", () => {
    assert.equal(
      publicSpotFeedbackPath("org-uuid", "abc123token"),
      "/feedback/org-uuid/abc123token",
    );
  });
});
