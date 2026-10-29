import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env/public";

let adminClient: SupabaseClient | null = null;

/** Service-role Supabase client for Storage and other privileged server operations. */
export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY for server-side Storage.");
  }

  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  adminClient = createClient(NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
