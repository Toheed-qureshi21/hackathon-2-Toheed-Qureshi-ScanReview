import { jsonError, jsonSuccess } from "@/lib/api/response";
import { authorizeAdminMembership } from "@/lib/auth/admin-access";
import { requireOrganizationMembership } from "@/lib/auth/membership";
import {
  inviteManagerForOrganization,
  ManagerInviteError,
} from "@/lib/services/manager-invite";
import { inviteManagerBodySchema } from "@/lib/validations/manager-invite";

export async function POST(request: Request) {
  const membership = await requireOrganizationMembership();
  const access = authorizeAdminMembership(membership, {
    forbiddenMessage: "Only an admin can invite a manager.",
  });
  if (!access.ok) {
    return jsonError(access.code, access.message, access.status);
  }
  if (!membership.ok) {
    return jsonError("UNAUTHENTICATED", "Sign in to continue.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = inviteManagerBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Enter a valid manager name and email.",
      422,
      { issues: parsed.error.flatten() },
    );
  }

  try {
    const managerInvite = await inviteManagerForOrganization({
      organizationId: access.organizationId,
      adminEmail: membership.user.email,
      managerName: parsed.data.managerName,
      managerEmail: parsed.data.managerEmail,
    });
    return jsonSuccess({ managerInvite }, managerInvite.sent ? 201 : 200);
  } catch (error) {
    if (error instanceof ManagerInviteError) {
      return jsonError(error.code, error.message, error.status);
    }
    return jsonError(
      "INTERNAL_ERROR",
      "Unable to send the manager invite right now.",
      500,
    );
  }
}
