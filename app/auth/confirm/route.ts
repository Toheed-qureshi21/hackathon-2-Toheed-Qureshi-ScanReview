import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { resolveAuthConfirmRedirect } from "@/lib/auth/confirm-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authConfirmQuerySchema } from "@/lib/validations/manager-invite";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const parsed = authConfirmQuerySchema.safeParse({
    token_hash: requestUrl.searchParams.get("token_hash") ?? undefined,
    type: requestUrl.searchParams.get("type") ?? undefined,
  });

  if (!parsed.success) {
    const fallback = resolveAuthConfirmRedirect({
      ok: false,
      type: requestUrl.searchParams.get("type"),
    });
    return NextResponse.redirect(confirmTarget(requestUrl, fallback));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type: parsed.data.type as EmailOtpType,
    token_hash: parsed.data.token_hash,
  });

  const redirect = resolveAuthConfirmRedirect({
    ok: !error,
    type: parsed.data.type,
  });
  return NextResponse.redirect(confirmTarget(requestUrl, redirect));
}

function confirmTarget(
  requestUrl: URL,
  redirect: { pathname: string; error: boolean },
): URL {
  const target = new URL(redirect.pathname, requestUrl.origin);
  if (redirect.error) {
    target.searchParams.set("error", "1");
  }
  return target;
}
