import { describe, expect, test } from "bun:test";
import { DEFAULT_ANONYMOUS_CONFIG } from "@sohappypdf/config";
import { isAppError } from "@sohappypdf/core";
import { resolveAnonymousConversionRequest } from "./anonymous-schemas.js";

describe("resolveAnonymousConversionRequest", () => {
  test("derives the target format from the registered tool", () => {
    const resolved = resolveAnonymousConversionRequest(
      {
        sourceFileId: "550e8400-e29b-41d4-a716-446655440000",
        type: "pdf-to-png",
      },
      DEFAULT_ANONYMOUS_CONFIG,
    );

    expect(resolved.targetFormat).toBe("png");
    expect(resolved.type).toBe("pdf-to-png");
  });

  test("rejects unregistered and over-limit merge inputs", () => {
    try {
      resolveAnonymousConversionRequest(
        {
          sourceFileId: "550e8400-e29b-41d4-a716-446655440000",
          type: "ocr-pdf",
        },
        DEFAULT_ANONYMOUS_CONFIG,
      );
      throw new Error("expected unsupported tool to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }

    const resolved = resolveAnonymousConversionRequest(
      {
        sourceFileId: "550e8400-e29b-41d4-a716-446655440000",
        type: "merge-pdf",
        additionalFileIds: [
          "550e8400-e29b-41d4-a716-446655440001",
          "550e8400-e29b-41d4-a716-446655440002",
        ],
      },
      DEFAULT_ANONYMOUS_CONFIG,
    );

    expect(resolved.type).toBe("merge-pdf");
    expect(resolved.additionalFileIds).toHaveLength(2);

    try {
      resolveAnonymousConversionRequest(
        {
          sourceFileId: "550e8400-e29b-41d4-a716-446655440000",
          type: "merge-pdf",
          additionalFileIds: Array.from({ length: 21 }, (_, index) => {
            const suffix = index.toString(16).padStart(12, "0");
            return `550e8400-e29b-41d4-a716-${suffix}`;
          }),
        },
        DEFAULT_ANONYMOUS_CONFIG,
      );
      throw new Error("expected merge over the tool file cap to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
