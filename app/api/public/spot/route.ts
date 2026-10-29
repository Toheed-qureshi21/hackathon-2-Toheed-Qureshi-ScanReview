import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  PublicSpotNotFoundError,
  resolvePublicSpot,
} from "@/lib/services/public-spot";
import { publicSpotQuerySchema } from "@/lib/validations/public-feedback";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = publicSpotQuerySchema.safeParse({
    token: searchParams.get("token") ?? undefined,
    organizationId: searchParams.get("organizationId") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError("NOT_FOUND", "This feedback link isn’t valid.", 404);
  }

  try {
    const data = await resolvePublicSpot(parsed.data);
    return jsonSuccess(data);
  } catch (error) {
    if (error instanceof PublicSpotNotFoundError) {
      return jsonError("NOT_FOUND", "This feedback link isn’t valid.", 404);
    }
    return jsonError(
      "INTERNAL_ERROR",
      "Unable to load this feedback page.",
      500,
    );
  }
}
