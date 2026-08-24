import { describe, expect, test } from "bun:test";
import { AiDocumentTooLargeError } from "./errors.js";
import {
  assertAiDocumentWithinLimits,
  truncateForAiRequest,
} from "./limits.js";
import { createMockAiProvider } from "./mock-provider.js";

describe("mock ai provider", () => {
  test("summarizes and translates without external calls", async () => {
    const provider = createMockAiProvider();
    const summary = await provider.summarize({
      text: "Hello world document",
      language: "eng",
    });
    const translated = await provider.translate({
      text: "Hello",
      targetLanguage: "tr",
    });

    expect(summary.summary).toContain("Hello world document");
    expect(translated.text).toBe("[tr] Hello");
  });
});

describe("ai document limits", () => {
  test("rejects oversized documents", () => {
    expect(() =>
      assertAiDocumentWithinLimits({
        pageCount: 100,
        extractedChars: 10,
        limits: {
          maxPages: 50,
          maxExtractedChars: 1000,
          maxRequestChars: 1000,
        },
      }),
    ).toThrow(AiDocumentTooLargeError);
  });

  test("truncates request text to the configured ceiling", () => {
    expect(truncateForAiRequest("abcdef", 3)).toBe("abc");
  });
});
