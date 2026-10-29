import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateAcceptInvite } from "@/lib/invites/accept-invite-rules";
import { acceptInviteBodySchema } from "@/lib/validations/manager-invite";
import { resolveAlertRecipient } from "@/lib/services/alert-recipient";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const EMAIL = "manager@venue.test";
const NOW = new Date("2026-10-29T12:00:00.000Z");

const pendingOrg = {
  id: ORG_A,
  pendingManagerEmail: EMAIL,
  inviteExpiresAt: new Date("2026-10-30T12:00:00.000Z"),
  inviteAcceptedAt: null as Date | null,
};

const appMetadata = {
  organizationId: ORG_A,
  role: "MANAGER",
};

describe("acceptInviteBodySchema", () => {
  it("ignores client-supplied role and organizationId", () => {
    const parsed = acceptInviteBodySchema.safeParse({
      role: "ADMIN",
      organizationId: ORG_B,
    });
    assert.equal(parsed.success, true);
  });
});

describe("evaluateAcceptInvite", () => {
  const base = {
    userId: "user-manager",
    email: EMAIL,
    appMetadata,
    userMetadata: { organizationId: ORG_B, role: "ADMIN" },
    organization: pendingOrg,
    hasExistingManager: false,
    existingMembershipUserId: null as string | null,
    clientRole: "ADMIN",
    clientOrganizationId: ORG_B,
    now: NOW,
  };

  it("returns 401 without a verified session email", () => {
    const result = evaluateAcceptInvite({ ...base, userId: null, email: null });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
      assert.equal(result.code, "UNAUTHENTICATED");
    }
  });

  it("rejects wrong-email acceptance", () => {
    const result = evaluateAcceptInvite({
      ...base,
      email: "other@venue.test",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "EMAIL_MISMATCH");
      assert.equal(result.status, 403);
    }
  });

  it("rejects mismatched organization metadata", () => {
    const result = evaluateAcceptInvite({
      ...base,
      appMetadata: { organizationId: ORG_B, role: "MANAGER" },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "ORGANIZATION_MISMATCH");
  });

  it("ignores user_metadata and client ADMIN role / other org id", () => {
    const result = evaluateAcceptInvite(base);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.metadata.role, "MANAGER");
      assert.equal(result.organizationId, ORG_A);
      assert.notEqual(result.organizationId, ORG_B);
    }
  });

  it("rejects expired invitations", () => {
    const result = evaluateAcceptInvite({
      ...base,
      organization: {
        ...pendingOrg,
        inviteExpiresAt: new Date("2026-10-28T12:00:00.000Z"),
      },
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "INVITE_EXPIRED");
      assert.equal(result.status, 410);
    }
  });

  it("rejects reused / already accepted invitations", () => {
    const result = evaluateAcceptInvite({
      ...base,
      organization: {
        ...pendingOrg,
        inviteAcceptedAt: new Date("2026-10-29T11:00:00.000Z"),
      },
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "INVITE_CONSUMED");
      assert.equal(result.status, 409);
    }
  });

  it("rejects a second manager for the same organization", () => {
    const result = evaluateAcceptInvite({
      ...base,
      hasExistingManager: true,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "MANAGER_EXISTS");
  });

  it("rejects duplicate user membership", () => {
    const result = evaluateAcceptInvite({
      ...base,
      existingMembershipUserId: "user-manager",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "MEMBERSHIP_EXISTS");
  });

  it("does not treat user_metadata ADMIN as authorization", () => {
    const result = evaluateAcceptInvite({
      ...base,
      appMetadata: { organizationId: ORG_A, role: "ADMIN" },
    });
    assert.equal(result.ok, false);
  });
});

describe("accepted manager alert recipient", () => {
  it("prefers the accepted manager alertEmail while mode stays MANAGER_PENDING", () => {
    const result = resolveAlertRecipient(
      {
        alertRecipient: "MANAGER_PENDING",
        pendingManagerEmail: "old-pending@venue.test",
      },
      [
        { role: "ADMIN", alertEmail: "admin@venue.test" },
        { role: "MANAGER", alertEmail: EMAIL },
      ],
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.emails, [EMAIL, "admin@venue.test"]);
    }
  });
});
