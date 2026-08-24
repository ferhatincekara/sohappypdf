import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/ai");

export { createAiProvider } from "./create-provider.js";
export {
  AiDocumentTooLargeError,
  AiNotConfiguredError,
  AiProviderError,
} from "./errors.js";
export {
  type AiDocumentLimits,
  aiLimitsFromConfig,
  assertAiDocumentWithinLimits,
  truncateForAiRequest,
} from "./limits.js";
export { createMockAiProvider } from "./mock-provider.js";
export type {
  AiExtractInput,
  AiExtractResult,
  AiProvider,
  AiSummarizeInput,
  AiSummarizeResult,
  AiTranslateInput,
  AiTranslateResult,
} from "./provider.js";
export { createStubAiProvider } from "./stub-provider.js";
