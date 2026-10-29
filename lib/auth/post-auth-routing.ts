import type { AuthMeData } from "@/types/auth-me";

/** Where to send the user after a successful Supabase sign-in/sign-up session. */
export function resolvePostAuthPath(
  me: AuthMeData,
  nextParam: string | null,
): string {
  if (me.pendingManagerInvite && !me.membership) {
    return "/accept-invite";
  }
  if (me.onboardingRequired || !me.membership) {
    return "/dashboard/onboarding";
  }
  if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
    return nextParam;
  }
  return "/dashboard";
}
