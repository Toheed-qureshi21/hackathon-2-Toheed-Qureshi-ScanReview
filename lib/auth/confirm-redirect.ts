export const AUTH_CONFIRM_TYPES = [
  "invite",
  "signup",
  "email",
  "magiclink",
  "recovery",
  "email_change",
] as const;

export type AuthConfirmType = (typeof AUTH_CONFIRM_TYPES)[number];

export type AuthConfirmRedirect = {
  pathname: string;
  error: boolean;
};

/** Map a verified (or failed) confirm OTP type to a same-origin redirect. */
export function resolveAuthConfirmRedirect(input: {
  ok: boolean;
  type: string | null | undefined;
}): AuthConfirmRedirect {
  const type = input.type;
  const isInvite = type === "invite";

  if (!input.ok) {
    return isInvite
      ? { pathname: "/accept-invite", error: true }
      : { pathname: "/auth/login", error: true };
  }

  if (isInvite) {
    return { pathname: "/accept-invite", error: false };
  }

  return { pathname: "/auth/login", error: false };
}
