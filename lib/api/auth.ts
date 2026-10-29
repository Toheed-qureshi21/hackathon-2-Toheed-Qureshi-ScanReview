import { apiGet } from "@/lib/api/client";
import type { AuthMeData } from "@/types/auth-me";

export async function getAuthMe(): Promise<AuthMeData> {
  return apiGet<AuthMeData>("/auth/me");
}
