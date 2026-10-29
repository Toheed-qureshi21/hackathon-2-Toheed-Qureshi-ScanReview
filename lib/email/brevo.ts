import "server-only";

import { getBrevoEnv } from "@/lib/email/brevo-config";
import {
  postBrevoTransactionalEmail,
  type BrevoSendInput,
  type BrevoSendResult,
} from "@/lib/email/brevo-request";

export type { AlertLogStatus } from "@/lib/email/alert-log";
export { logLowRatingAlertOutcome } from "@/lib/email/alert-log";
export type { BrevoSendInput, BrevoSendResult };

export async function sendBrevoTransactionalEmail(
  input: BrevoSendInput,
): Promise<BrevoSendResult> {
  const env = getBrevoEnv();
  if (!env) {
    return { ok: false, reason: "unconfigured" };
  }
  return postBrevoTransactionalEmail(env, input);
}
