import "server-only";

import { isBenignLogoutFailure } from "@/lib/auth/logout";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function terminateAuthSession(): Promise<
  { ok: true } | { ok: false }
> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (!error) {
    return { ok: true };
  }

  if (isBenignLogoutFailure(error)) {
    return { ok: true };
  }

  return { ok: false };
}
