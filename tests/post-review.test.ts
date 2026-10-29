import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildReviewPlatformHref,
  googlePlaceIdFromReviewUrl,
  isGoogleMapsReviewUrl,
  reviewPlatformLabel,
  reviewPostHint,
} from "@/lib/feedback/post-review";

const PLACE_ID = "ChIJN1t_tDeuEmsRUsoyG83frY4";

describe("Google Maps review handoff", () => {
  it("opens the write-review composer when the URL has a Place ID", () => {
    const href = buildReviewPlatformHref(
      `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`,
    );
    assert.equal(
      href,
      `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
    );
    assert.equal(href.includes("review="), false);
  });

  it("reads placeid from search.google.com writereview links", () => {
    assert.equal(
      googlePlaceIdFromReviewUrl(
        `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
      ),
      PLACE_ID,
    );
  });

  it("leaves a maps URL unchanged when there is no Place ID", () => {
    const maps = "https://maps.google.com/?cid=123456789";
    assert.equal(buildReviewPlatformHref(maps), maps);
  });

  it("pulls a Place ID out of a Maps data blob", () => {
    const maps =
      `https://www.google.com/maps/place/Example/@-33.8,151.2,17z/data=!3m1!4b1!4m6!3m5!1s${PLACE_ID}`;
    assert.equal(googlePlaceIdFromReviewUrl(maps), PLACE_ID);
    assert.equal(
      buildReviewPlatformHref(maps),
      `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
    );
  });

  it("labels Google hosts as Google Maps", () => {
    assert.equal(isGoogleMapsReviewUrl("https://maps.app.goo.gl/abc"), true);
    assert.equal(reviewPlatformLabel("https://www.google.com/maps"), "Google Maps");
    assert.equal(
      reviewPostHint("https://www.google.com/maps"),
      "We copy your draft, then open Google Maps. Paste it there.",
    );
  });
});
