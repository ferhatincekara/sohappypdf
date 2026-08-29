import { describe, expect, test } from "bun:test";
import {
  canDownloadConversion,
  isConversionExpired,
} from "@/features/conversions/lib/can-download-conversion";
import type { PublicConversion } from "@/features/conversions/types/conversion";

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
    expiresAt: "2026-08-24T02:00:00.000Z",
    expired: false,
    ...overrides,
  };
}

describe("canDownloadConversion", () => {
  test("allows download only for completed conversions with an output file", () => {
    const now = new Date("2026-08-24T01:00:00.000Z");

    expect(canDownloadConversion(createConversion(), now)).toBe(true);
    expect(
      canDownloadConversion(createConversion({ outputFileId: null }), now),
    ).toBe(false);
    expect(
      canDownloadConversion(
        createConversion({ status: "failed", outputFileId: null }),
        now,
      ),
    ).toBe(false);
    expect(
      canDownloadConversion(createConversion({ status: "processing" }), now),
    ).toBe(false);
  });

  test("rejects expired executions even when an output id remains", () => {
    const now = new Date("2026-08-24T03:00:00.000Z");

    expect(isConversionExpired(createConversion(), now)).toBe(true);
    expect(canDownloadConversion(createConversion(), now)).toBe(false);
    expect(
      canDownloadConversion(createConversion({ expired: true }), now),
    ).toBe(false);
  });

  test("treats missing expiresAt as expired after two hours", () => {
    const now = new Date("2026-08-24T03:00:00.000Z");

    expect(
      isConversionExpired(
        createConversion({
          createdAt: "2026-08-24T00:00:00.000Z",
          expiresAt: null,
        }),
        now,
      ),
    ).toBe(true);
    expect(
      isConversionExpired(
        createConversion({
          createdAt: "2026-08-24T02:00:00.000Z",
          expiresAt: null,
        }),
        now,
      ),
    ).toBe(false);
  });
});
