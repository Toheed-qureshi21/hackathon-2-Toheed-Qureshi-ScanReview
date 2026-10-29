import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAlreadyRegisteredAuthError } from "@/lib/invites/already-registered";
import {
  MANAGER_INVITE_ROLE,
  type ManagerInviteAppMetadata,
} from "@/lib/invites/manager-invite-metadata";
import type { ManagerInviteAuthPort } from "@/lib/invites/manager-invite-auth-port";

export type {
  InviteAuthResult,
  ManagerInviteAuthPort,
} from "@/lib/invites/manager-invite-auth-port";

export const supabaseManagerInviteAuth: ManagerInviteAuthPort = {
  async inviteUserByEmail(email, redirectTo) {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });
    if (error || !data.user?.id) {
      if (isAlreadyRegisteredAuthError(error)) {
        return { ok: false, reason: "already_registered" };
      }
      return { ok: false, reason: "failed" };
    }
    return { ok: true, userId: data.user.id };
  },

  async setAppMetadata(userId, metadata: ManagerInviteAppMetadata) {
    const admin = getSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: {
        organizationId: metadata.organizationId,
        role: MANAGER_INVITE_ROLE,
      },
    });
    return !error;
  },

  async deleteUser(userId) {
    const admin = getSupabaseAdminClient();
    await admin.auth.admin.deleteUser(userId);
  },
};
