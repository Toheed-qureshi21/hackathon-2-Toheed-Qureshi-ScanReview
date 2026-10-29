import type { ManagerInviteAppMetadata } from "@/lib/invites/manager-invite-metadata";

export type InviteAuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "already_registered" | "failed" };

export type ManagerInviteAuthPort = {
  inviteUserByEmail(email: string, redirectTo: string): Promise<InviteAuthResult>;
  setAppMetadata(
    userId: string,
    metadata: ManagerInviteAppMetadata,
  ): Promise<boolean>;
  deleteUser(userId: string): Promise<void>;
};
