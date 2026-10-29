/** Map Supabase Auth admin errors without leaking provider bodies. */
export function isAlreadyRegisteredAuthError(error: {
  message?: string | null;
  code?: string | null;
  status?: number | null;
} | null | undefined): boolean {
  if (!error) {
    return false;
  }
  const code = error.code?.toLowerCase() ?? "";
  if (
    code === "email_exists" ||
    code === "user_already_exists" ||
    code === "already_registered"
  ) {
    return true;
  }
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("user already exists")
  );
}
