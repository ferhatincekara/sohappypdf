import type {
  AiExtractInput,
  AiExtractResult,
  AiProvider,
  AiSummarizeInput,
  AiSummarizeResult,
  AiTranslateInput,
  AiTranslateResult,
} from "./provider.js";

/**
 * Deterministic provider for tests. Does not call external APIs.
 */
export function createMockAiProvider(): AiProvider {
  return {
    async summarize(input: AiSummarizeInput): Promise<AiSummarizeResult> {
      const preview = input.text.trim().slice(0, 120).replace(/\s+/g, " ");
      return {
        summary: `Summary (${input.language ?? "eng"}): ${preview}`,
      };
    },

    async translate(input: AiTranslateInput): Promise<AiTranslateResult> {
      return {
        text: `[${input.targetLanguage}] ${input.text}`,
      };
    },

    async extract(input: AiExtractInput): Promise<AiExtractResult> {
      return {
        data: {
          schemaHint: input.schemaHint ?? null,
          charCount: input.text.length,
        },
      };
    },
  };
}
