import {
  runGeminiReviewDraft,
  type GeminiDraftResult,
  type GeminiGenerateContentFn,
} from "@/lib/ai/gemini-call";
import {
  buildReviewDraftPrompt,
  uniqueHighlights,
} from "@/lib/ai/review-draft-content";

export async function composePublicReviewDraft(input: {
  organizationName: string;
  spotDisplayName: string;
  rating: number;
  comment: string | null;
  highlights?: readonly string[];
  generateContent: GeminiGenerateContentFn;
}): Promise<GeminiDraftResult> {
  const prompt = buildReviewDraftPrompt({
    organizationName: input.organizationName,
    spotDisplayName: input.spotDisplayName,
    rating: input.rating,
    comment: input.comment,
    highlights: uniqueHighlights(input.highlights),
  });

  return runGeminiReviewDraft({
    systemInstruction: prompt.systemInstruction,
    userText: prompt.userText,
    generateContent: input.generateContent,
  });
}
