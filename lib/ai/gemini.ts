import "server-only";

import { GoogleGenAI } from "@google/genai";

import { getGeminiEnv } from "@/lib/ai/gemini-config";
import {
  runGeminiReviewDraft,
  type GeminiDraftResult,
  type GeminiGenerateContentFn,
} from "@/lib/ai/gemini-call";

export { GEMINI_REVIEW_MODEL } from "@/lib/ai/gemini-config";
export type { GeminiDraftResult };

const defaultGenerateContent: GeminiGenerateContentFn = async (input) => {
  const env = getGeminiEnv();
  if (!env) {
    throw new Error("unconfigured");
  }

  const ai = new GoogleGenAI({ apiKey: env.apiKey });
  const response = await ai.models.generateContent({
    model: input.model,
    contents: input.userText,
    config: {
      systemInstruction: input.systemInstruction,
      temperature: 0.3,
      maxOutputTokens: input.maxOutputTokens,
      abortSignal: input.abortSignal,
      httpOptions: { timeout: input.timeoutMs },
    },
  });
  return response.text;
};

export async function generateGeminiReviewDraft(input: {
  systemInstruction: string;
  userText: string;
  generateContent?: GeminiGenerateContentFn;
}): Promise<GeminiDraftResult> {
  if (!input.generateContent && !getGeminiEnv()) {
    return { ok: false, reason: "unconfigured" };
  }
  return runGeminiReviewDraft({
    systemInstruction: input.systemInstruction,
    userText: input.userText,
    generateContent: input.generateContent ?? defaultGenerateContent,
  });
}
