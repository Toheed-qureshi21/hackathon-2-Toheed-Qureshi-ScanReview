import { jsonError, jsonSuccess } from "@/lib/api/response";
import { authorizeAdminMembership } from "@/lib/auth/admin-access";
import { requireOrganizationMembership } from "@/lib/auth/membership";
import {
  createAdditionalSpot,
  QrPersistenceFailedError,
  SpotLimitReachedError,
} from "@/lib/services/create-spot";
import { listSpotsForOrganization } from "@/lib/services/spots-list";
import {
  createSpotBodySchema,
  resolveCreateSpotOrganizationId,
} from "@/lib/validations/create-spot";
import { listSpotsQuerySchema } from "@/lib/validations/spots-query";

export async function GET(request: Request) {
  const membership = await requireOrganizationMembership();
  if (!membership.ok) {
    if (membership.reason === "unauthenticated") {
      return jsonError("UNAUTHENTICATED", "Sign in to continue.", 401);
    }
    return jsonError(
      "FORBIDDEN",
      "Complete onboarding to access spots.",
      403,
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = listSpotsQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
  });
  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Invalid query parameters.",
      422,
      { issues: parsed.error.flatten() },
    );
  }

  try {
    const data = await listSpotsForOrganization(
      membership.member.organizationId,
      parsed.data,
    );
    return jsonSuccess(data);
  } catch {
    return jsonError(
      "INTERNAL_ERROR",
      "Unable to load spots right now.",
      500,
    );
  }
}

export async function POST(request: Request) {
  const membership = await requireOrganizationMembership();
  const access = authorizeAdminMembership(membership, {
    forbiddenMessage: "Managers cannot create or change spots.",
  });
  if (!access.ok) {
    return jsonError(access.code, access.message, access.status);
  }

  let raw: unknown = {};
  const text = await request.text();
  if (text.trim()) {
    try {
      raw = JSON.parse(text) as unknown;
    } catch {
      return jsonError("INVALID_JSON", "Request body must be valid JSON.", 400);
    }
  }
  if (raw === null) {
    raw = {};
  }

  const parsed = createSpotBodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Invalid request body.",
      422,
      { issues: parsed.error.flatten() },
    );
  }

  const organizationId = resolveCreateSpotOrganizationId(
    access.organizationId,
    raw,
  );

  try {
    const data = await createAdditionalSpot(organizationId);
    return jsonSuccess(data, 201);
  } catch (error) {
    if (error instanceof SpotLimitReachedError) {
      return jsonError(error.code, error.message, error.status);
    }
    if (error instanceof QrPersistenceFailedError) {
      return jsonError(
        "QR_STORAGE_FAILED",
        "The QR code could not be saved. Try again.",
        500,
      );
    }
    return jsonError(
      "INTERNAL_ERROR",
      "Unable to create a QR code right now.",
      500,
    );
  }
}
