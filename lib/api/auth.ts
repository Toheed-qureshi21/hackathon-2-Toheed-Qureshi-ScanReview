import { apiGet, apiPost } from "@/lib/api/client";
import type { LogoutSuccess } from "@/lib/auth/logout";
import type { AuthMeData } from "@/types/auth-me";

export async function getAuthMe(): Promise<AuthMeData> {
  return apiGet<AuthMeData>("/auth/me");
}

export async function postLogout(): Promise<LogoutSuccess> {
  return apiPost<LogoutSuccess>("/auth/logout");
}
