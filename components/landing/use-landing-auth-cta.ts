"use client";

import { useCurrentUser } from "@/hooks/queries/use-current-user";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-routing";

export function useLandingAuthCta() {
  const { data, isSuccess } = useCurrentUser();
  const signedIn = isSuccess && Boolean(data);
  const href = data ? resolvePostAuthPath(data, null) : "/auth/login";
  return { signedIn, href };
}
