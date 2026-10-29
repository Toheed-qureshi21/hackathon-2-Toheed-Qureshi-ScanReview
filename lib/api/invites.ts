import { apiPost } from "@/lib/api/client";
import type {
  AcceptInviteResponse,
  InviteManagerResponse,
} from "@/types/manager-invite";

export async function postInviteManager(body: {
  managerName: string;
  managerEmail: string;
}): Promise<InviteManagerResponse> {
  return apiPost<InviteManagerResponse>("/invites/manager", body);
}

export async function postAcceptInvite(
  body: Record<string, unknown> = {},
): Promise<AcceptInviteResponse> {
  return apiPost<AcceptInviteResponse>("/auth/accept-invite", body);
}
