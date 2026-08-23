import { describe, expect, test } from "bun:test";
import type { PublicConversion } from "../types/conversion";
import { canDownloadConversion } from "./can-download-conversion";

function createConversion(
  overrides: Partial<PublicConversion> = {},
): PublicConversion {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    status: "completed",
    sourceFileId: "11111111-1111-4111-8111-111111111111",
    sourceFilename: "report.pdf",
    outputFileId: "33333333-3333-4333-8333-333333333333",
    type: "pdf-to-jpg",
    sourceFormat: "pdf",
    targetFormat: "jpg",
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    queuedAt: null,
    startedAt: null,
    completedAt: "2026-08-24T00:01:00.000Z",
    ...overrides,
  };
}

describe("canDownloadConversion", () => {
  test("allows download only for completed conversions with an output file", () => {
    expect(canDownloadConversion(createConversion())).toBe(true);
    expect(
      canDownloadConversion(createConversion({ outputFileId: null })),
    ).toBe(false);
    expect(
      canDownloadConversion(
        createConversion({ status: "failed", outputFileId: null }),
      ),
    ).toBe(false);
    expect(
      canDownloadConversion(createConversion({ status: "processing" })),
    ).toBe(false);
  });
});
