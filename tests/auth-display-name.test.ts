import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { initialsFromLabel, roleLabel } from "@/lib/auth/display-name";

describe("initialsFromLabel", () => {
  it("uses two letters for a single word", () => {
    assert.equal(initialsFromLabel("Bloom"), "BL");
  });

  it("uses first letters for two words", () => {
    assert.equal(initialsFromLabel("Alex Morgan"), "AM");
  });
});

describe("roleLabel", () => {
  it("maps admin and manager", () => {
    assert.equal(roleLabel("ADMIN"), "Admin");
    assert.equal(roleLabel("MANAGER"), "Manager");
  });
});
