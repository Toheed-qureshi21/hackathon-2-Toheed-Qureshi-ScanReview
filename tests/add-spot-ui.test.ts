import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiClientError } from "@/lib/api/api-error";
import {
  ADD_SPOT_LIMIT_MESSAGE,
  addSpotErrorMessage,
  addSpotSuccessMessage,
  appendCreatedSpotToList,
  canAddSpot,
  isAtSpotLimit,
} from "@/lib/dashboard/add-spot-action";
import type { CreateSpotResponse, SpotsListResponse } from "@/types/spot";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

function spotItem(
  id: string,
  number: number,
  displayName: string,
): CreateSpotResponse["spot"] {
  return {
    id,
    number,
    displayName,
    publicToken: `token-${id}`,
    publicFeedbackPath: `/feedback/${ORG_ID}/token-${id}`,
    publicFeedbackUrl: `https://app.example/feedback/${ORG_ID}/token-${id}`,
    qrStoragePath: `organizations/${ORG_ID}/spots/${id}.png`,
    qrImageUrl: `https://example.supabase.co/storage/v1/object/public/scanreview-qr-codes/organizations/${ORG_ID}/spots/${id}.png`,
  };
}

const existingList: SpotsListResponse = {
  organization: { id: ORG_ID, name: "Bloom", spotLabel: "Table" },
  spots: [spotItem("spot-1", 1, "Table 1")],
};

const created: CreateSpotResponse = {
  organization: { id: ORG_ID, name: "Bloom", spotLabel: "Table" },
  spot: spotItem("spot-2", 2, "Table 2"),
};

describe("dashboard Add QR Code action states", () => {
  it("keeps the action unavailable to managers", () => {
    assert.equal(
      canAddSpot({ isAdmin: false, spotCount: 3, isPending: false }),
      false,
    );
  });

  it("shows a loading-disabled state while creation is pending", () => {
    assert.equal(
      canAddSpot({ isAdmin: true, spotCount: 3, isPending: true }),
      false,
    );
  });

  it("enables the action for an admin under the cap", () => {
    assert.equal(
      canAddSpot({ isAdmin: true, spotCount: 3, isPending: false }),
      true,
    );
  });

  it("surfaces the 50-spot limit in the dashboard", () => {
    assert.equal(isAtSpotLimit(50), true);
    assert.equal(
      canAddSpot({ isAdmin: true, spotCount: 50, isPending: false }),
      false,
    );
    assert.equal(
      addSpotErrorMessage(
        new ApiClientError(
          "SPOT_LIMIT_REACHED",
          "cap",
          409,
        ),
      ),
      ADD_SPOT_LIMIT_MESSAGE,
    );
  });

  it("maps API failures to a visible error message", () => {
    assert.equal(
      addSpotErrorMessage(
        new ApiClientError(
          "QR_STORAGE_FAILED",
          "The QR code could not be saved. Try again.",
          500,
        ),
      ),
      "The QR code could not be saved. Try again.",
    );
  });

  it("reports successful creation with the new spot label", () => {
    assert.equal(addSpotSuccessMessage("Table 2"), "Created Table 2.");
  });

  it("inserts the created QR into the spots list without a reload", () => {
    const next = appendCreatedSpotToList(existingList, created);
    assert.equal(next.spots.length, 2);
    assert.equal(next.spots[1]?.id, "spot-2");
    assert.equal(next.spots[1]?.displayName, "Table 2");
    assert.ok(next.spots[1]?.qrImageUrl);
    assert.equal(next.spots[1]?.publicFeedbackUrl.includes("/feedback/demo"), false);
  });

  it("does not duplicate a spot already present in cache", () => {
    const once = appendCreatedSpotToList(existingList, created);
    const twice = appendCreatedSpotToList(once, created);
    assert.equal(twice.spots.length, 2);
  });
});
