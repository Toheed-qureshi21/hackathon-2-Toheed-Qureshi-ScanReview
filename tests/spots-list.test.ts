import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildOnboardingSpotDto,
  buildSpotListItem,
} from "@/lib/services/spot-dto";
import { listSpotsQuerySchema } from "@/lib/validations/spots-query";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const SPOT_ID = "22222222-2222-4222-8222-222222222222";
const STORAGE_PATH = `organizations/${ORG_ID}/spots/${SPOT_ID}.png`;

const spotRecord = {
  id: SPOT_ID,
  number: 3,
  displayName: "Table 3",
  publicToken: "public-token-abc",
  qrStoragePath: STORAGE_PATH,
};

describe("buildSpotListItem", () => {
  it("builds feedback and QR URLs for a persisted spot", () => {
    const item = buildSpotListItem(
      ORG_ID,
      spotRecord,
      "https://app.example",
      "https://example.supabase.co",
    );
    assert.equal(item.displayName, "Table 3");
    assert.match(item.publicFeedbackUrl, /^https:\/\/app\.example\/feedback\//);
    assert.match(item.qrImageUrl ?? "", /scanreview-qr-codes/);
    assert.equal(item.qrStoragePath, STORAGE_PATH);
  });

  it("returns null QR URL when storage path is missing", () => {
    const item = buildSpotListItem(
      ORG_ID,
      { ...spotRecord, qrStoragePath: null },
      "https://app.example",
      "https://example.supabase.co",
    );
    assert.equal(item.qrImageUrl, null);
    assert.equal(item.qrStoragePath, null);
  });
});

describe("buildOnboardingSpotDto", () => {
  it("requires a storage path", () => {
    assert.throws(() =>
      buildOnboardingSpotDto(
        ORG_ID,
        { ...spotRecord, qrStoragePath: null },
        "https://app.example",
        "https://example.supabase.co",
      ),
    );
  });
});

describe("listSpotsQuerySchema", () => {
  it("accepts optional search", () => {
    assert.equal(listSpotsQuerySchema.safeParse({}).success, true);
    assert.equal(
      listSpotsQuerySchema.safeParse({ search: "table" }).success,
      true,
    );
  });

  it("rejects overly long search", () => {
    assert.equal(
      listSpotsQuerySchema.safeParse({ search: "x".repeat(81) }).success,
      false,
    );
  });
});
