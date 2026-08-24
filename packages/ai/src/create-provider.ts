import { type AiConfig, loadAiConfig } from "@repo/config";
import { createMockAiProvider } from "./mock-provider.js";
import type { AiProvider } from "./provider.js";
import { createStubAiProvider } from "./stub-provider.js";

export function createAiProvider(
  config: AiConfig = loadAiConfig(),
): AiProvider {
  switch (config.provider) {
    case "mock":
      return createMockAiProvider();
    case "stub":
      return createStubAiProvider();
  }
}
