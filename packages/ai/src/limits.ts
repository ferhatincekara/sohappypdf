import type { AiConfig } from "@repo/config";
import { AiDocumentTooLargeError } from "./errors.js";

export type AiDocumentLimits = {
  maxPages: number;
  maxExtractedChars: number;
  maxRequestChars: number;
};

export function aiLimitsFromConfig(config: AiConfig): AiDocumentLimits {
  return {
    maxPages: config.maxPages,
    maxExtractedChars: config.maxExtractedChars,
    maxRequestChars: config.maxRequestChars,
  };
}

export function assertAiDocumentWithinLimits(input: {
  pageCount: number;
  extractedChars: number;
  limits: AiDocumentLimits;
}): void {
  if (input.pageCount > input.limits.maxPages) {
    throw new AiDocumentTooLargeError(
      `Document exceeds the maximum of ${String(input.limits.maxPages)} pages for AI tools`,
    );
  }

  if (input.extractedChars > input.limits.maxExtractedChars) {
    throw new AiDocumentTooLargeError(
      `Extracted text exceeds the maximum of ${String(input.limits.maxExtractedChars)} characters for AI tools`,
    );
  }

  if (input.extractedChars > input.limits.maxRequestChars) {
    throw new AiDocumentTooLargeError(
      `Document exceeds the maximum AI request size of ${String(input.limits.maxRequestChars)} characters`,
    );
  }
}

export function truncateForAiRequest(
  text: string,
  maxRequestChars: number,
): string {
  if (text.length <= maxRequestChars) {
    return text;
  }

  return text.slice(0, maxRequestChars);
}
