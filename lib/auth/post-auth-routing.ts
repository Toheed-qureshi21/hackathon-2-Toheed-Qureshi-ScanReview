import type { AuthMeData } from "@/types/auth-me";

/** Where to send the user after a successful Supabase sign-in/sign-up session. */
export function resolvePostAuthPath(
  me: AuthMeData,
  nextParam: string | null,
): string {
  if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
    if (me.membership || nextParam.startsWith("/dashboard/onboarding")) {
      return nextParam;
    }
  }
  return me.onboardingRequired ? "/dashboard/onboarding" : "/dashboard";
}
