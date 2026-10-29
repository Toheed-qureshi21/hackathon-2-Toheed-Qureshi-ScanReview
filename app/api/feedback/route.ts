import { jsonError, jsonSuccess } from "@/lib/api/response";
import { authorizeFeedbackList } from "@/lib/auth/feedback-list-access";
import { requireOrganizationMembership } from "@/lib/auth/membership";
import { listFeedbackForOrganization } from "@/lib/services/feedback-list";
import { listFeedbackQueryFromSearchParams } from "@/lib/validations/feedback-query";

export async function GET(request: Request) {
  const membership = await requireOrganizationMembership();
  const parsed = listFeedbackQueryFromSearchParams(
    new URL(request.url).searchParams,
  );

  const access = authorizeFeedbackList({
    membership,
    requestedOrganizationId: parsed.success
      ? parsed.data.organizationId
      : undefined,
  });
  if (!access.ok) {
    return jsonError(access.code, access.message, access.status);
  }

  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Invalid query parameters.",
      422,
      { issues: parsed.error.flatten() },
    );
  }

  try {
    const data = await listFeedbackForOrganization(access.organizationId, {
      search: parsed.data.search,
      limit: parsed.data.limit,
      cursor: parsed.data.cursor,
    });
    return jsonSuccess(data);
  } catch {
    return jsonError(
      "INTERNAL_ERROR",
      "Unable to load feedback right now.",
      500,
    );
  }
}
