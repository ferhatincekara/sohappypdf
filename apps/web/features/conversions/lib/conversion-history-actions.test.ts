import { describe, expect, test } from "bun:test";
import type { PublicConversion } from "../types/conversion";
import { conversionHistoryActions } from "./conversion-history-actions";

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

describe("conversion history actions", () => {
  test("shows view and download for a completed conversion", () => {
    expect(conversionHistoryActions(createConversion())).toEqual({
      canView: true,
      canDownload: true,
      canRetry: false,
    });
  });

  test("hides download for failed conversions and does not invent retry", () => {
    expect(
      conversionHistoryActions(
        createConversion({
          status: "failed",
          outputFileId: null,
          completedAt: null,
        }),
      ),
    ).toEqual({
      canView: true,
      canDownload: false,
      canRetry: false,
    });
  });
});
