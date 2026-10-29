import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  createOrganizationFromOnboarding,
  OrganizationAlreadyExistsError,
} from "@/lib/services/organizations-onboarding";
import {
  createOrganizationBodySchema,
  mapOrganizationBodyToDomain,
} from "@/lib/validations/onboarding";

export async function POST(request: Request) {
  const session = await getAuthenticatedUser();
  if (!session.ok) {
    return jsonError("UNAUTHENTICATED", "Sign in to continue.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = createOrganizationBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Please check the submitted fields.",
      422,
      { issues: parsed.error.flatten() },
    );
  }

  try {
    const domain = mapOrganizationBodyToDomain(parsed.data);
    const payload = await createOrganizationFromOnboarding(
      domain,
      session.user,
    );
    return jsonSuccess(payload, 201);
  } catch (error) {
    if (error instanceof OrganizationAlreadyExistsError) {
      return jsonError(
        "ORGANIZATION_ALREADY_EXISTS",
        "You already belong to an organization.",
        409,
      );
    }
    return jsonError(
      "INTERNAL_ERROR",
      "Unable to create your organization right now.",
      500,
    );
  }
}
