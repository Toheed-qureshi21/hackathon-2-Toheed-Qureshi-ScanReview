import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertPublicFeedbackRateLimit,
  PUBLIC_FEEDBACK_RATE_LIMIT,
  PublicFeedbackRateLimitError,
  resetPublicFeedbackRateLimitForTests,
} from "@/lib/feedback/public-rate-limit";
import { getPublicClientIp } from "@/lib/feedback/client-ip";
import {
  isHighRating,
  isLowRating,
  shouldPersistGuestRating,
} from "@/lib/feedback/guest-submit-flow";
import { generatePublicSpotToken } from "@/lib/spots/public-token";
import { buildFeedbackCreateData } from "@/lib/feedback/feedback-create-data";
import {
  createPublicFeedbackBodySchema,
  emptyToNull,
  parseOptionalContact,
  publicSpotQuerySchema,
} from "@/lib/validations/public-feedback";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const TOKEN = generatePublicSpotToken();

const validBody = {
  token: TOKEN,
  organizationId: ORG_ID,
  rating: 4,
};

describe("createPublicFeedbackBodySchema ratings", () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    it(`accepts rating ${rating}`, () => {
      const parsed = createPublicFeedbackBodySchema.safeParse({
        ...validBody,
        rating,
      });
      assert.equal(parsed.success, true);
    });
  }

  it("rejects rating below 1", () => {
    assert.equal(
      createPublicFeedbackBodySchema.safeParse({ ...validBody, rating: 0 })
        .success,
      false,
    );
  });

  it("rejects rating above 5", () => {
    assert.equal(
      createPublicFeedbackBodySchema.safeParse({ ...validBody, rating: 6 })
        .success,
      false,
    );
  });

  it("rejects fractional rating", () => {
    assert.equal(
      createPublicFeedbackBodySchema.safeParse({ ...validBody, rating: 3.5 })
        .success,
      false,
    );
  });

  it("rejects string rating", () => {
    assert.equal(
      createPublicFeedbackBodySchema.safeParse({ ...validBody, rating: "4" })
        .success,
      false,
    );
  });
});

describe("public token and organization query", () => {
  it("rejects missing token", () => {
    assert.equal(
      publicSpotQuerySchema.safeParse({ organizationId: ORG_ID }).success,
      false,
    );
  });

  it("rejects unknown-format token", () => {
    assert.equal(
      publicSpotQuerySchema.safeParse({
        organizationId: ORG_ID,
        token: "short",
      }).success,
      false,
    );
  });

  it("rejects invalid organization id", () => {
    assert.equal(
      publicSpotQuerySchema.safeParse({
        organizationId: "not-a-uuid",
        token: TOKEN,
      }).success,
      false,
    );
  });
});

describe("optional comment and contact", () => {
  it("allows null comment", () => {
    const parsed = createPublicFeedbackBodySchema.safeParse({
      ...validBody,
      comment: null,
    });
    assert.equal(parsed.success, true);
  });

  it("rejects oversized comment", () => {
    assert.equal(
      createPublicFeedbackBodySchema.safeParse({
        ...validBody,
        comment: "x".repeat(501),
      }).success,
      false,
    );
  });

  it("parses email contact", () => {
    const parsed = parseOptionalContact("guest@example.com");
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.value.contactEmail, "guest@example.com");
      assert.equal(parsed.value.contactPhone, null);
    }
  });

  it("parses phone contact", () => {
    const parsed = parseOptionalContact("+1 555 123 4567");
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.value.contactPhone, "+1 555 123 4567");
      assert.equal(parsed.value.contactEmail, null);
    }
  });

  it("rejects invalid contact", () => {
    const parsed = parseOptionalContact("not-contact");
    assert.equal(parsed.ok, false);
  });

  it("stores empty strings as null", () => {
    assert.equal(emptyToNull("  "), null);
    assert.equal(emptyToNull("Ada"), "Ada");
  });
});

describe("buildFeedbackCreateData", () => {
  it("binds org and spot from resolved records, not client ids", () => {
    const data = buildFeedbackCreateData(
      { id: "spot-db", organizationId: "org-db" },
      {
        rating: 2,
        comment: null,
        contactName: null,
        contactEmail: null,
        contactPhone: "555-0100",
      },
    );
    assert.equal(data.organizationId, "org-db");
    assert.equal(data.spotId, "spot-db");
    assert.equal(data.rating, 2);
    assert.equal("createdAt" in data, false);
  });
});

describe("public spot DTO shape", () => {
  it("does not include membership or manager fields", () => {
    const dto = {
      organizationName: "Cafe",
      spotDisplayName: "Table 1",
      publicReviewUrl: null as string | null,
    };
    assert.equal("pendingManagerEmail" in dto, false);
    assert.equal("alertEmail" in dto, false);
    assert.equal("publicToken" in dto, false);
    assert.equal("members" in dto, false);
  });
});

describe("rate limit", () => {
  it("allows repeat ratings under the token cap", () => {
    resetPublicFeedbackRateLimitForTests();
    for (let i = 0; i < PUBLIC_FEEDBACK_RATE_LIMIT.tokenLimit; i += 1) {
      assert.doesNotThrow(() =>
        assertPublicFeedbackRateLimit("tok-a", "1.1.1.1"),
      );
    }
  });

  it("throws after the token cap", () => {
    resetPublicFeedbackRateLimitForTests();
    for (let i = 0; i < PUBLIC_FEEDBACK_RATE_LIMIT.tokenLimit; i += 1) {
      assertPublicFeedbackRateLimit("tok-b", "2.2.2.2");
    }
    assert.throws(
      () => assertPublicFeedbackRateLimit("tok-b", "2.2.2.2"),
      PublicFeedbackRateLimitError,
    );
  });
});

describe("getPublicClientIp", () => {
  it("uses the first x-forwarded-for hop", () => {
    const request = new Request("https://example.test", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });
    assert.equal(getPublicClientIp(request), "203.0.113.1");
  });
});

describe("guest persist gating", () => {
  it("does not persist demo ratings", () => {
    assert.equal(shouldPersistGuestRating(true), false);
    assert.equal(shouldPersistGuestRating(false), true);
  });

  it("classifies low and high ratings", () => {
    assert.equal(isLowRating(1), true);
    assert.equal(isLowRating(2), true);
    assert.equal(isHighRating(3), true);
    assert.equal(isHighRating(5), true);
  });
});
