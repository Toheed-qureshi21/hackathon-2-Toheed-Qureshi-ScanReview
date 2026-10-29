import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authorizeAdminMembership } from "@/lib/auth/admin-access";
import { publicSpotFeedbackUrl } from "@/lib/feedback/public-spot-url";
import { SPOT_COUNT_MAX } from "@/lib/onboarding/constants";
import { buildOnboardingSpotDto } from "@/lib/services/spot-dto";
import {
  allocateNextSpot,
  applySerializedSpotAllocations,
} from "@/lib/spots/allocate-next-spot";
import {
  isDemoFeedbackUrl,
  persistCreatedSpotQr,
  QrPersistenceFailedError,
} from "@/lib/spots/persist-created-spot-qr";
import { generatePublicSpotToken } from "@/lib/spots/public-token";
import { reserveUniquePublicSpotToken } from "@/lib/spots/reserve-public-token";
import { spotQrStoragePath } from "@/lib/storage/qr-codes-constants";
import {
  createSpotBodySchema,
  resolveCreateSpotOrganizationId,
} from "@/lib/validations/create-spot";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const SPOT_ID = "33333333-3333-4333-8333-333333333333";
const TOKEN = "opaque-public-token-value";

const MANAGER_FORBIDDEN = "Managers cannot create or change spots.";

function adminMembership(organizationId = ORG_A) {
  return {
    ok: true as const,
    member: { organizationId, role: "ADMIN" as const },
  };
}

describe("POST /api/spots authorization", () => {
  it("rejects unauthenticated callers with 401", () => {
    const access = authorizeAdminMembership({
      ok: false,
      reason: "unauthenticated",
    });
    assert.equal(access.ok, false);
    if (!access.ok) {
      assert.equal(access.status, 401);
      assert.equal(access.code, "UNAUTHENTICATED");
    }
  });

  it("rejects managers with 403", () => {
    const access = authorizeAdminMembership(
      {
        ok: true,
        member: { organizationId: ORG_A, role: "MANAGER" },
      },
      { forbiddenMessage: MANAGER_FORBIDDEN },
    );
    assert.equal(access.ok, false);
    if (!access.ok) {
      assert.equal(access.status, 403);
      assert.equal(access.code, "FORBIDDEN");
      assert.equal(access.message, MANAGER_FORBIDDEN);
    }
  });

  it("allows an admin and scopes to membership organizationId", () => {
    const access = authorizeAdminMembership(adminMembership(ORG_A), {
      forbiddenMessage: MANAGER_FORBIDDEN,
    });
    assert.equal(access.ok, true);
    if (access.ok) {
      assert.equal(access.organizationId, ORG_A);
    }
  });
});

describe("createSpotBodySchema and trusted organization scope", () => {
  it("accepts an empty object", () => {
    assert.equal(createSpotBodySchema.safeParse({}).success, true);
  });

  it("strips client-supplied ownership values", () => {
    const parsed = createSpotBodySchema.safeParse({
      organizationId: ORG_B,
      role: "ADMIN",
      number: 99,
      publicToken: "client-token",
      displayName: "Hijacked Table",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.deepEqual(parsed.data, {});
    }
  });

  it("never uses a client organizationId as the create scope", () => {
    const scoped = resolveCreateSpotOrganizationId(ORG_A, {
      organizationId: ORG_B,
      role: "MANAGER",
      number: 1,
      publicToken: "forged",
    });
    assert.equal(scoped, ORG_A);
    assert.notEqual(scoped, ORG_B);
  });

  it("rejects non-object JSON bodies", () => {
    assert.equal(createSpotBodySchema.safeParse("ORG_B").success, false);
    assert.equal(createSpotBodySchema.safeParse(12).success, false);
    assert.equal(createSpotBodySchema.safeParse([]).success, false);
  });
});

describe("allocateNextSpot", () => {
  it("starts at 1 for an empty organization", () => {
    const result = allocateNextSpot([], "Table");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.number, 1);
      assert.equal(result.displayName, "Table 1");
    }
  });

  it("uses the configured custom label for the next number", () => {
    const result = allocateNextSpot([1, 2], "Patio Seat");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.number, 3);
      assert.equal(result.displayName, "Patio Seat 3");
    }
  });

  it("continues after a gap using max(number)+1", () => {
    const result = allocateNextSpot([1, 4], "Counter");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.number, 5);
      assert.equal(result.displayName, "Counter 5");
    }
  });

  it("rejects creation at the 50-spot cap", () => {
    const existing = Array.from({ length: SPOT_COUNT_MAX }, (_, i) => i + 1);
    const result = allocateNextSpot(existing, "Table");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "SPOT_LIMIT_REACHED");
    }
  });

  it("serialized concurrent creates never duplicate numbers or exceed 50", () => {
    const existing = Array.from({ length: 48 }, (_, i) => i + 1);
    const outcome = applySerializedSpotAllocations(existing, "Table", 5);
    assert.equal(outcome.successes, 2);
    assert.equal(outcome.limitRejections, 3);
    assert.equal(outcome.numbers.length, SPOT_COUNT_MAX);
    assert.deepEqual(outcome.numbers.slice(-2), [49, 50]);
    assert.equal(new Set(outcome.numbers).size, SPOT_COUNT_MAX);
  });

  it("overlapping reads of the same snapshot would collide without a lock", () => {
    const snapshot = [1, 2, 3];
    const first = allocateNextSpot(snapshot, "Table");
    const second = allocateNextSpot(snapshot, "Table");
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (first.ok && second.ok) {
      assert.equal(first.number, second.number);
    }
  });
});

describe("reserveUniquePublicSpotToken", () => {
  it("returns a cryptographically random token that is not client-supplied", async () => {
    const token = await reserveUniquePublicSpotToken({
      findUnique: async () => null,
    });
    assert.notEqual(token, "client-token");
    assert.notEqual(token, TOKEN);
    assert.match(token, /^[A-Za-z0-9_-]{16,}$/);
    assert.notEqual(token, generatePublicSpotToken());
  });

  it("retries when the generated token already exists", async () => {
    let lookups = 0;
    const token = await reserveUniquePublicSpotToken({
      findUnique: async () => {
        lookups += 1;
        return lookups === 1 ? { id: SPOT_ID } : null;
      },
    });
    assert.equal(lookups, 2);
    assert.ok(token.length >= 16);
  });
});

describe("QR URL construction and storage path", () => {
  it("builds a real guest feedback URL for the new token, not /feedback/demo", () => {
    const url = publicSpotFeedbackUrl(
      "https://app.example",
      ORG_A,
      TOKEN,
    );
    assert.equal(
      url,
      `https://app.example/feedback/${ORG_A}/${TOKEN}`,
    );
    assert.equal(isDemoFeedbackUrl(url), false);
    assert.equal(url.includes("/feedback/demo"), false);
  });

  it("persists an organization-scoped storage path on the DTO", () => {
    const qrStoragePath = spotQrStoragePath(ORG_A, SPOT_ID);
    const dto = buildOnboardingSpotDto(
      ORG_A,
      {
        id: SPOT_ID,
        number: 4,
        displayName: "Booth 4",
        publicToken: TOKEN,
        qrStoragePath,
      },
      "https://app.example",
      "https://example.supabase.co",
    );
    assert.equal(dto.qrStoragePath, qrStoragePath);
    assert.match(dto.qrImageUrl, /scanreview-qr-codes/);
    assert.equal(
      dto.publicFeedbackUrl,
      `https://app.example/feedback/${ORG_A}/${TOKEN}`,
    );
    assert.equal(dto.publicFeedbackUrl.includes("/feedback/demo"), false);
  });
});

describe("persistCreatedSpotQr failure handling", () => {
  it("rolls back the spot when storage upload fails", async () => {
    const rolledBack: { spotId: string; paths: string[] }[] = [];
    await assert.rejects(
      () =>
        persistCreatedSpotQr({
          organizationId: ORG_A,
          spotId: SPOT_ID,
          publicToken: TOKEN,
          appOrigin: "https://app.example",
          renderPng: async () => Buffer.from("png"),
          upload: async () => {
            throw new Error("storage down");
          },
          savePath: async () => {
            throw new Error("should not persist path");
          },
          rollback: async (spotId, paths) => {
            rolledBack.push({ spotId, paths });
          },
        }),
      (error: unknown) => error instanceof QrPersistenceFailedError,
    );
    assert.deepEqual(rolledBack, [{ spotId: SPOT_ID, paths: [] }]);
  });

  it("removes the uploaded object and deletes the spot when the database update fails", async () => {
    const rolledBack: { spotId: string; paths: string[] }[] = [];
    const expectedPath = spotQrStoragePath(ORG_A, SPOT_ID);
    await assert.rejects(
      () =>
        persistCreatedSpotQr({
          organizationId: ORG_A,
          spotId: SPOT_ID,
          publicToken: TOKEN,
          appOrigin: "https://app.example",
          renderPng: async (url) => {
            assert.equal(isDemoFeedbackUrl(url), false);
            return Buffer.from("png");
          },
          upload: async () => undefined,
          savePath: async () => {
            throw new Error("database write failed");
          },
          rollback: async (spotId, paths) => {
            rolledBack.push({ spotId, paths });
          },
        }),
      (error: unknown) => error instanceof QrPersistenceFailedError,
    );
    assert.deepEqual(rolledBack, [
      { spotId: SPOT_ID, paths: [expectedPath] },
    ]);
  });

  it("does not report success when render fails", async () => {
    let saved = false;
    await assert.rejects(
      () =>
        persistCreatedSpotQr({
          organizationId: ORG_A,
          spotId: SPOT_ID,
          publicToken: TOKEN,
          appOrigin: "https://app.example",
          renderPng: async () => {
            throw new Error("png failed");
          },
          upload: async () => undefined,
          savePath: async () => {
            saved = true;
          },
          rollback: async () => undefined,
        }),
      (error: unknown) => error instanceof QrPersistenceFailedError,
    );
    assert.equal(saved, false);
  });
});
