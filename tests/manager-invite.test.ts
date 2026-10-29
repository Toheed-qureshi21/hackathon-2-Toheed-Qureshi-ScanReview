import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authorizeAdminMembership } from "@/lib/auth/admin-access";
import { isAlreadyRegisteredAuthError } from "@/lib/invites/already-registered";
import { bindManagerInviteAuth } from "@/lib/invites/bind-manager-invite-auth";
import {
  parseInviteAppMetadata,
  hasPendingManagerInviteMetadata,
} from "@/lib/invites/manager-invite-metadata";
import {
  evaluateManagerInviteEligibility,
  isSelfInvite,
  normalizeManagerEmail,
} from "@/lib/invites/manager-invite-rules";
import { inviteManagerBodySchema } from "@/lib/validations/manager-invite";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";

function adminMembership(organizationId = ORG_A) {
  return {
    ok: true as const,
    member: { organizationId, role: "ADMIN" as const },
  };
}

describe("inviteManagerBodySchema", () => {
  it("accepts a valid name and email", () => {
    const parsed = inviteManagerBodySchema.safeParse({
      managerName: "Sam Manager",
      managerEmail: "sam@venue.test",
    });
    assert.equal(parsed.success, true);
  });

  it("rejects invalid email and empty name", () => {
    assert.equal(
      inviteManagerBodySchema.safeParse({
        managerName: "Sam",
        managerEmail: "not-an-email",
      }).success,
      false,
    );
    assert.equal(
      inviteManagerBodySchema.safeParse({
        managerName: "  ",
        managerEmail: "sam@venue.test",
      }).success,
      false,
    );
  });

  it("strips client-supplied role and organizationId", () => {
    const parsed = inviteManagerBodySchema.safeParse({
      managerName: "Sam",
      managerEmail: "sam@venue.test",
      role: "ADMIN",
      organizationId: ORG_B,
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal("role" in parsed.data, false);
      assert.equal("organizationId" in parsed.data, false);
    }
  });
});

describe("authorizeAdminMembership", () => {
  it("returns 401 for unauthenticated callers", () => {
    const access = authorizeAdminMembership({
      ok: false,
      reason: "unauthenticated",
    });
    assert.equal(access.ok, false);
    if (!access.ok) {
      assert.equal(access.status, 401);
    }
  });

  it("forbids MANAGER from sending invitations", () => {
    const access = authorizeAdminMembership({
      ok: true,
      member: { organizationId: ORG_A, role: "MANAGER" },
    });
    assert.equal(access.ok, false);
    if (!access.ok) {
      assert.equal(access.status, 403);
    }
  });

  it("allows ADMIN and uses membership organizationId only", () => {
    const access = authorizeAdminMembership(adminMembership(ORG_A));
    assert.equal(access.ok, true);
    if (access.ok) {
      assert.equal(access.organizationId, ORG_A);
      assert.notEqual(access.organizationId, ORG_B);
    }
  });
});

describe("evaluateManagerInviteEligibility", () => {
  const base = {
    adminEmail: "admin@venue.test",
    managerEmail: "manager@venue.test",
    hasExistingManager: false,
    otherPendingOrganizationIds: [] as string[],
    inviteeAlreadyHasMembership: false,
  };

  it("rejects self-invitation", () => {
    assert.equal(isSelfInvite("Admin@Venue.test", "admin@venue.test"), true);
    const result = evaluateManagerInviteEligibility({
      ...base,
      managerEmail: "ADMIN@venue.test",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "SELF_INVITE");
  });

  it("rejects an existing manager in the organization", () => {
    const result = evaluateManagerInviteEligibility({
      ...base,
      hasExistingManager: true,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "MANAGER_EXISTS");
  });

  it("rejects an email that already has a membership", () => {
    const result = evaluateManagerInviteEligibility({
      ...base,
      inviteeAlreadyHasMembership: true,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "MEMBERSHIP_EXISTS");
  });

  it("fails closed when the same pending email matches another organization", () => {
    const result = evaluateManagerInviteEligibility({
      ...base,
      otherPendingOrganizationIds: [ORG_B],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "AMBIGUOUS_PENDING_EMAIL");
  });

  it("allows a unique pending invite for this organization", () => {
    const result = evaluateManagerInviteEligibility(base);
    assert.equal(result.ok, true);
  });
});

describe("invite app_metadata binding", () => {
  it("reads organization and MANAGER role only from app_metadata", () => {
    const parsed = parseInviteAppMetadata({
      organizationId: ORG_A,
      role: "MANAGER",
    });
    assert.deepEqual(parsed, { organizationId: ORG_A, role: "MANAGER" });
    assert.equal(
      parseInviteAppMetadata({ organizationId: ORG_A, role: "ADMIN" }),
      null,
    );
    assert.equal(hasPendingManagerInviteMetadata({ role: "MANAGER" }), false);
  });
});

describe("already-registered Auth emails", () => {
  it("detects Supabase already-registered errors without using the body as success", () => {
    assert.equal(
      isAlreadyRegisteredAuthError({
        message: "A user with this email address has already been registered",
      }),
      true,
    );
    assert.equal(
      isAlreadyRegisteredAuthError({ code: "email_exists" }),
      true,
    );
    assert.equal(
      isAlreadyRegisteredAuthError({ message: "network timeout" }),
      false,
    );
  });
});

describe("bindManagerInviteAuth", () => {
  const email = "manager@venue.test";

  it("maps already-registered invite results to a conflict", async () => {
    const result = await bindManagerInviteAuth({
      invited: { ok: false, reason: "already_registered" },
      organizationId: ORG_A,
      email,
      auth: {
        setAppMetadata: async () => true,
        deleteUser: async () => {
          throw new Error("should not delete");
        },
      },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "already_registered");
  });

  it("returns sent:false on invite send failure without writing metadata", async () => {
    let metadataCalls = 0;
    const result = await bindManagerInviteAuth({
      invited: { ok: false, reason: "failed" },
      organizationId: ORG_A,
      email,
      auth: {
        setAppMetadata: async () => {
          metadataCalls += 1;
          return true;
        },
        deleteUser: async () => undefined,
      },
    });
    assert.equal(result.ok, false);
    if (!result.ok && result.reason === "failed") {
      assert.match(result.notice, /could not be sent/i);
    }
    assert.equal(metadataCalls, 0);
  });

  it("rolls back the Auth user when app_metadata binding fails", async () => {
    const deleted: string[] = [];
    const result = await bindManagerInviteAuth({
      invited: { ok: true, userId: "auth-user-1" },
      organizationId: ORG_A,
      email,
      auth: {
        setAppMetadata: async () => false,
        deleteUser: async (userId) => {
          deleted.push(userId);
        },
      },
    });
    assert.equal(result.ok, false);
    if (!result.ok && result.reason === "failed") {
      assert.match(result.notice, /could not be finished/i);
    }
    assert.deepEqual(deleted, ["auth-user-1"]);
  });

  it("binds MANAGER app_metadata to the membership organization, not a client org id", async () => {
    let bound: { organizationId: string; role: string } | null = null;
    const result = await bindManagerInviteAuth({
      invited: { ok: true, userId: "auth-user-1" },
      organizationId: ORG_A,
      email,
      auth: {
        setAppMetadata: async (_userId, metadata) => {
          bound = metadata;
          return true;
        },
        deleteUser: async () => undefined,
      },
    });
    assert.equal(result.ok, true);
    assert.deepEqual(bound, { organizationId: ORG_A, role: "MANAGER" });
  });
});

describe("normalizeManagerEmail", () => {
  it("lowercases for comparisons", () => {
    assert.equal(normalizeManagerEmail("  Sam@Venue.TEST "), "sam@venue.test");
  });
});
