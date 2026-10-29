import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  acceptManagerInvite,
  AcceptInviteError,
} from "@/lib/services/accept-invite";
import { acceptInviteBodySchema } from "@/lib/validations/manager-invite";

export async function POST(request: Request) {
  const session = await getAuthenticatedUser();
  if (!session.ok) {
    return jsonError("UNAUTHENTICATED", "Sign in to continue.", 401);
  }

  let body: unknown = {};
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_JSON", "Request body must be valid JSON.", 400);
    }
  }

  const parsed = acceptInviteBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Invalid request.",
      422,
      { issues: parsed.error.flatten() },
    );
  }

  try {
    const data = await acceptManagerInvite(session.user, {
      role: (parsed.data as { role?: unknown }).role,
      organizationId: (parsed.data as { organizationId?: unknown }).organizationId,
    });
    return jsonSuccess(data);
  } catch (error) {
    if (error instanceof AcceptInviteError) {
      return jsonError(error.code, error.message, error.status);
    }
    return jsonError(
      "INTERNAL_ERROR",
      "Unable to accept this invite right now.",
      500,
    );
  }
}
