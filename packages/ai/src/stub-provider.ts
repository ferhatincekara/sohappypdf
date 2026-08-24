import { AiNotConfiguredError } from "./errors.js";
import type { AiProvider } from "./provider.js";

/**
 * Default production placeholder until a concrete vendor is configured.
 */
export function createStubAiProvider(): AiProvider {
  return {
    async summarize() {
      throw new AiNotConfiguredError();
    },
    async translate() {
      throw new AiNotConfiguredError();
    },
    async extract() {
      throw new AiNotConfiguredError();
    },
  };
}
