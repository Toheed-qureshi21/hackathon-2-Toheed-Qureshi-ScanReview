import { z } from "zod";

const brevoEnvSchema = z.object({
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
});

export type BrevoEnv = {
  apiKey: string;
  senderEmail: string;
};

/** Returns null when Brevo is not configured — callers must skip, not throw. */
export function getBrevoEnv(): BrevoEnv | null {
  const parsed = brevoEnvSchema.safeParse({
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
  });
  if (!parsed.success) return null;
  return {
    apiKey: parsed.data.BREVO_API_KEY,
    senderEmail: parsed.data.BREVO_SENDER_EMAIL,
  };
}
