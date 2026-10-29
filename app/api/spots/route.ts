import { jsonError, jsonSuccess } from "@/lib/api/response";
import { requireOrganizationMembership } from "@/lib/auth/membership";
import { listSpotsForOrganization } from "@/lib/services/spots-list";
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

export async function POST() {
  const membership = await requireOrganizationMembership();
  if (!membership.ok) {
    if (membership.reason === "unauthenticated") {
      return jsonError("UNAUTHENTICATED", "Sign in to continue.", 401);
    }
    return jsonError(
      "FORBIDDEN",
      "Complete onboarding to manage spots.",
      403,
    );
  }

  if (membership.member.role === "MANAGER") {
    return jsonError(
      "FORBIDDEN",
      "Managers cannot create or change spots.",
      403,
    );
  }

  return jsonError(
    "NOT_IMPLEMENTED",
    "Adding spots after onboarding is not available yet.",
    501,
  );
}
