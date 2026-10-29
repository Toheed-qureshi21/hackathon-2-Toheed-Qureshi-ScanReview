import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseAuthUser } from "@/lib/auth/me-mapper";

export type SessionResult =
  | { ok: true; user: SupabaseAuthUser }
  | { ok: false; reason: "unauthenticated" | "invalid" };

/** Verify the Supabase session server-side. Never trust client-provided user ids. */
export async function getAuthenticatedUser(): Promise<SessionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { ok: false, reason: "unauthenticated" };
  }

  return {
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
      app_metadata: data.user.app_metadata,
    },
  };
}
