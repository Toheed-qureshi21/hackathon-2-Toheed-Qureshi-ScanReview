import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getAuthMePayload } from "@/lib/services/auth-me";

export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session.ok) {
    return jsonError(
      "UNAUTHENTICATED",
      "Sign in to continue.",
      401,
    );
  }

  try {
    const payload = await getAuthMePayload(session.user);
    return jsonSuccess(payload);
  } catch {
    return jsonError(
      "INTERNAL_ERROR",
      "Unable to load your account right now.",
      500,
    );
  }
}
