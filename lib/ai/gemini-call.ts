import {
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_REVIEW_MODELS,
  GEMINI_TIMEOUT_MS,
} from "@/lib/ai/gemini-config";
import { sanitizeReviewDraftText } from "@/lib/ai/review-draft-content";

export type GeminiDraftResult =
  | { ok: true; text: string }
  | {
      ok: false;
      reason:
        | "unconfigured"
        | "timeout"
        | "failed"
        | "malformed"
        | "model_unavailable";
    };

export type GeminiGenerateContentFn = (input: {
  model: string;
  systemInstruction: string;
  userText: string;
  abortSignal: AbortSignal;
  timeoutMs: number;
  maxOutputTokens: number;
}) => Promise<string | undefined>;

export function classifyGeminiError(
  error: unknown,
): Exclude<GeminiDraftResult, { ok: true }>["reason"] {
  if (
    (error instanceof Error && error.name === "AbortError") ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name?: string }).name === "AbortError")
  ) {
    return "timeout";
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("aborted") || message.includes("timeout")) {
    return "timeout";
  }
  if (
    message.includes("not found") ||
    message.includes("not_found") ||
    message.includes("404") ||
    (message.includes("model") && message.includes("does not exist"))
  ) {
    return "model_unavailable";
  }
  return "failed";
}

export async function runGeminiReviewDraft(input: {
  systemInstruction: string;
  userText: string;
  generateContent: GeminiGenerateContentFn;
}): Promise<GeminiDraftResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    let lastUnavailable = false;
    for (const model of GEMINI_REVIEW_MODELS) {
      try {
        const raw = await input.generateContent({
          model,
          systemInstruction: input.systemInstruction,
          userText: input.userText,
          abortSignal: controller.signal,
          timeoutMs: GEMINI_TIMEOUT_MS,
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        });
        const text = sanitizeReviewDraftText(raw);
        if (!text) return { ok: false, reason: "malformed" };
        return { ok: true, text };
      } catch (error) {
        const reason = classifyGeminiError(error);
        if (reason === "model_unavailable") {
          lastUnavailable = true;
          continue;
        }
        return { ok: false, reason };
      }
    }
    return {
      ok: false,
      reason: lastUnavailable ? "model_unavailable" : "failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

export type ReviewDraftLogStatus =
  | "ok"
  | "unconfigured"
  | "timeout"
  | "failed"
  | "malformed"
  | "model_unavailable"
  | "skipped_demo";

export function logReviewDraftOutcome(input: {
  status: ReviewDraftLogStatus;
}): void {
  console.info("[review-draft]", { status: input.status });
}
