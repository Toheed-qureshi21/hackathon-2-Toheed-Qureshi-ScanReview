import type {
  InviteAuthResult,
  ManagerInviteAuthPort,
} from "@/lib/invites/manager-invite-auth-port";
import { MANAGER_INVITE_ROLE } from "@/lib/invites/manager-invite-metadata";

export type BindManagerInviteAuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "already_registered" }
  | { ok: false; reason: "failed"; notice: string };

export async function bindManagerInviteAuth(input: {
  invited: InviteAuthResult;
  organizationId: string;
  email: string;
  auth: Pick<ManagerInviteAuthPort, "setAppMetadata" | "deleteUser">;
}): Promise<BindManagerInviteAuthResult> {
  void input.email;
  if (!input.invited.ok) {
    if (input.invited.reason === "already_registered") {
      return { ok: false, reason: "already_registered" };
    }
    return {
      ok: false,
      reason: "failed",
      notice:
        "Manager details were saved, but the invite email could not be sent. You can try again.",
    };
  }

  const metadataOk = await input.auth.setAppMetadata(input.invited.userId, {
    organizationId: input.organizationId,
    role: MANAGER_INVITE_ROLE,
  });
  if (!metadataOk) {
    try {
      await input.auth.deleteUser(input.invited.userId);
    } catch {
      // Fail closed: do not mark the invite sent.
    }
    return {
      ok: false,
      reason: "failed",
      notice:
        "Manager details were saved, but the invite could not be finished. You can try again.",
    };
  }

  return { ok: true, userId: input.invited.userId };
}
