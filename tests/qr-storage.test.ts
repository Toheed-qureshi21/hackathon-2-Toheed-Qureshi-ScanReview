import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildOnboardingSpotDto } from "@/lib/services/onboarding-spot-dto";
import { renderQrPngBuffer } from "@/lib/spots/render-qr-png";
import {
  publicQrImageUrl,
  QR_PNG_CONTENT_TYPE,
  spotQrStoragePath,
} from "@/lib/storage/qr-codes-constants";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const SPOT_ID = "22222222-2222-4222-8222-222222222222";

describe("spotQrStoragePath", () => {
  it("builds organization-scoped storage paths", () => {
    assert.equal(
      spotQrStoragePath(ORG_ID, SPOT_ID),
      `organizations/${ORG_ID}/spots/${SPOT_ID}.png`,
    );
  });

  it("rejects invalid ids", () => {
    assert.throws(() => spotQrStoragePath("not-a-uuid", SPOT_ID));
  });
});

describe("publicQrImageUrl", () => {
  it("builds public Supabase Storage object URLs", () => {
    const path = spotQrStoragePath(ORG_ID, SPOT_ID);
    assert.equal(
      publicQrImageUrl("https://example.supabase.co", path),
      `https://example.supabase.co/storage/v1/object/public/scanreview-qr-codes/${path}`,
    );
  });
});

describe("renderQrPngBuffer", () => {
  it("returns PNG bytes encoding the provided URL", async () => {
    const url = "https://app.example/feedback/org/token";
    const png = await renderQrPngBuffer(url);
    assert.ok(Buffer.isBuffer(png));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(QR_PNG_CONTENT_TYPE, "image/png");
  });
});

describe("buildOnboardingSpotDto", () => {
  it("includes qr storage path and public image URL", () => {
    const storagePath = spotQrStoragePath(ORG_ID, SPOT_ID);
    const dto = buildOnboardingSpotDto(
      ORG_ID,
      {
        id: SPOT_ID,
        number: 1,
        displayName: "Table 1",
        publicToken: "abc-token-value",
        qrStoragePath: storagePath,
      },
      "https://app.example",
      "https://example.supabase.co",
    );
    assert.equal(dto.qrStoragePath, storagePath);
    assert.match(dto.qrImageUrl, /scanreview-qr-codes/);
    assert.equal(
      dto.publicFeedbackUrl,
      `https://app.example/feedback/${encodeURIComponent(ORG_ID)}/${encodeURIComponent("abc-token-value")}`,
    );
  });
});
