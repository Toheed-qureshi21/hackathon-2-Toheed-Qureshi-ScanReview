/** Client-safe helpers for logout behavior (no server imports). */

export type LogoutSuccess = {
  success: true;
};

export function isBenignLogoutFailure(error: {
  message?: string;
  code?: string;
  status?: number;
}): boolean {
  const message = (error.message ?? "").toLowerCase();
  if (message.includes("auth session missing")) return true;
  if (message.includes("session") && message.includes("missing")) return true;
  if (error.code === "session_not_found") return true;
  if (error.status === 403) return true;
  return false;
}
