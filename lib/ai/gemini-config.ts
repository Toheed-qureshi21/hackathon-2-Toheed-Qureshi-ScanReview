import { z } from "zod";

export const GEMINI_REVIEW_MODEL = "gemini-2.5-flash";
export const GEMINI_TIMEOUT_MS = 10_000;
export const GEMINI_MAX_OUTPUT_TOKENS = 400;
export const REVIEW_DRAFT_MAX_CHARS = 1000;

const geminiEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
});

export type GeminiEnv = {
  apiKey: string;
};

/** Returns null when Gemini is not configured — callers must fail safely, not throw. */
export function getGeminiEnv(): GeminiEnv | null {
  const parsed = geminiEnvSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });
  if (!parsed.success) return null;
  return { apiKey: parsed.data.GEMINI_API_KEY };
}
