import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createOrganizationBodySchema } from "@/lib/validations/onboarding";

const validBase = {
  organizationName: "Cafe Nova",
  businessType: "Restaurant" as const,
  labelPreset: "Table" as const,
  spotCount: 10,
  alertRecipient: "me" as const,
};

describe("createOrganizationBodySchema", () => {
  it("accepts valid onboarding input", () => {
    const parsed = createOrganizationBodySchema.safeParse(validBase);
    assert.equal(parsed.success, true);
  });

  it("rejects spot count below 1", () => {
    const parsed = createOrganizationBodySchema.safeParse({
      ...validBase,
      spotCount: 0,
    });
    assert.equal(parsed.success, false);
  });

  it("rejects spot count above 50", () => {
    const parsed = createOrganizationBodySchema.safeParse({
      ...validBase,
      spotCount: 51,
    });
    assert.equal(parsed.success, false);
  });

  it("rejects non-https review URLs", () => {
    const parsed = createOrganizationBodySchema.safeParse({
      ...validBase,
      reviewUrl: "http://example.com",
    });
    assert.equal(parsed.success, false);
  });

  it("requires manager fields when manager alerts selected", () => {
    const parsed = createOrganizationBodySchema.safeParse({
      ...validBase,
      alertRecipient: "manager",
    });
    assert.equal(parsed.success, false);
  });

  it("requires custom business type when Custom selected", () => {
    const parsed = createOrganizationBodySchema.safeParse({
      ...validBase,
      businessType: "Custom",
    });
    assert.equal(parsed.success, false);
  });
});
