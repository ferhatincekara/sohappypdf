export type AiSummarizeInput = {
  text: string;
  language?: string;
};

export type AiSummarizeResult = {
  summary: string;
};

export type AiTranslateInput = {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
};

export type AiTranslateResult = {
  text: string;
};

export type AiExtractInput = {
  text: string;
  schemaHint?: string;
};

export type AiExtractResult = {
  data: Record<string, unknown>;
};

/**
 * Vendor-agnostic AI capability surface.
 * Implementations must not log prompts or document text.
 */
export type AiProvider = {
  summarize(input: AiSummarizeInput): Promise<AiSummarizeResult>;
  translate(input: AiTranslateInput): Promise<AiTranslateResult>;
  extract(input: AiExtractInput): Promise<AiExtractResult>;
};
