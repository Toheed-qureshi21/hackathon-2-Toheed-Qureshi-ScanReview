import { apiGet, apiPost } from "@/lib/api/client";
import type {
  PublicFeedbackDto,
  PublicSpotDto,
} from "@/types/public-feedback";
import type { CreatePublicFeedbackBody } from "@/lib/validations/public-feedback";

export async function getPublicSpot(input: {
  organizationId: string;
  token: string;
}): Promise<PublicSpotDto> {
  const params = new URLSearchParams({
    organizationId: input.organizationId,
    token: input.token,
  });
  return apiGet<PublicSpotDto>(`/public/spot?${params.toString()}`);
}

export async function postPublicFeedback(
  body: CreatePublicFeedbackBody,
): Promise<PublicFeedbackDto> {
  return apiPost<PublicFeedbackDto>("/public/feedback", body);
}
