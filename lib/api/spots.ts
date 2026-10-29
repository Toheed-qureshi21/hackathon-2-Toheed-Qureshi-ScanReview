import { apiGet, apiPost } from "@/lib/api/client";
import type { CreateSpotResponse, SpotsListResponse } from "@/types/spot";

export async function getSpots(search?: string): Promise<SpotsListResponse> {
  const params =
    search && search.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : "";
  return apiGet<SpotsListResponse>(`/spots${params}`);
}

export async function postCreateSpot(): Promise<CreateSpotResponse> {
  return apiPost<CreateSpotResponse, Record<string, never>>("/spots", {});
}
