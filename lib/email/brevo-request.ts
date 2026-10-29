import type { BrevoEnv } from "@/lib/email/brevo-config";
import { EMAIL_PATTERN } from "@/lib/validations/public-feedback";

export const BREVO_TIMEOUT_MS = 8_000;
export const BREVO_SMTP_URL = "https://api.brevo.com/v3/smtp/email";

export type BrevoSendInput = {
  toEmail: string;
  subject: string;
  text: string;
  html: string;
};

export type BrevoSendResult =
  | { ok: true }
  | { ok: false; reason: "unconfigured" | "invalid_recipient" | "failed" };

export async function postBrevoTransactionalEmail(
  env: BrevoEnv,
  input: BrevoSendInput,
  fetchImpl: typeof fetch = fetch,
): Promise<BrevoSendResult> {
  if (!EMAIL_PATTERN.test(input.toEmail.trim())) {
    return { ok: false, reason: "invalid_recipient" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BREVO_TIMEOUT_MS);

  try {
    const response = await fetchImpl(BREVO_SMTP_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env.apiKey,
      },
      body: JSON.stringify({
        sender: {
          email: env.senderEmail,
          name: "ScanReview",
        },
        to: [{ email: input.toEmail.trim() }],
        subject: input.subject,
        textContent: input.text,
        htmlContent: input.html,
      }),
    });

    if (!response.ok) {
      return { ok: false, reason: "failed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  } finally {
    clearTimeout(timer);
  }
}
