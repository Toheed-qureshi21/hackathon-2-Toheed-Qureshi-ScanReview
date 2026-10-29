import { apiPost } from "@/lib/api/client";
import type { CreateOrganizationResponse } from "@/types/organization-onboarding";
import type { CreateOrganizationBody } from "@/lib/validations/onboarding";

export async function postCreateOrganization(
  body: CreateOrganizationBody,
): Promise<CreateOrganizationResponse> {
  return apiPost<CreateOrganizationResponse>("/organizations", body);
}
