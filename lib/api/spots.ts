import { apiGet } from "@/lib/api/client";
import type { SpotsListResponse } from "@/types/spot";

export async function getSpots(search?: string): Promise<SpotsListResponse> {
  const params =
    search && search.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : "";
  return apiGet<SpotsListResponse>(`/spots${params}`);
}
