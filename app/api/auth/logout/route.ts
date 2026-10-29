import { jsonError, jsonSuccess } from "@/lib/api/response";
import { terminateAuthSession } from "@/lib/services/auth-logout";

export async function POST() {
  try {
    const result = await terminateAuthSession();
    if (!result.ok) {
      return jsonError(
        "LOGOUT_FAILED",
        "Could not sign out. Try again.",
        500,
      );
    }
    return jsonSuccess({ success: true as const });
  } catch {
    return jsonError(
      "INTERNAL_ERROR",
      "Could not sign out.",
      500,
    );
  }
}
