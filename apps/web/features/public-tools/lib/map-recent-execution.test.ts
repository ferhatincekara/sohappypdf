import { describe, expect, test } from "bun:test";
import type { PublicConversion } from "@/features/conversions/types/conversion";
import { mapRecentExecution } from "./map-recent-execution";

function conversion(
  overrides: Partial<PublicConversion> = {},
): PublicConversion {
  return {
    id: "550e8400-e29b-41d4-a716-446655440001",
    status: "completed",
    sourceFileId: "550e8400-e29b-41d4-a716-446655440002",
    sourceFilename: "invoice.pdf",
    outputFileId: "550e8400-e29b-41d4-a716-446655440003",
    type: "split-pdf",
    sourceFormat: "pdf",
    targetFormat: "pdf",
    createdAt: "2026-08-24T11:48:00.000Z",
    updatedAt: "2026-08-24T11:48:10.000Z",
    queuedAt: "2026-08-24T11:48:01.000Z",
    startedAt: "2026-08-24T11:48:02.000Z",
    completedAt: "2026-08-24T11:48:10.000Z",
    expiresAt: "2026-08-24T13:48:00.000Z",
    expired: false,
    ...overrides,
  };
}

describe("mapRecentExecution", () => {
  const now = new Date("2026-08-24T12:00:00.000Z");

  test("maps a completed result without exposing error internals", () => {
    const mapped = mapRecentExecution(
      conversion({
        error: { code: "processing_failed", message: "worker stack" },
      }),
      now,
    );

    expect(mapped).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440001",
      toolId: "split-pdf",
      toolRoute: "/split-pdf",
      sourceFilename: "invoice.pdf",
      createdAt: "2026-08-24T11:48:00.000Z",
      expiresAt: "2026-08-24T13:48:00.000Z",
      status: "completed",
      canDownload: true,
      outputFileId: "550e8400-e29b-41d4-a716-446655440003",
    });
    expect(JSON.stringify(mapped).includes("worker stack")).toBe(false);
  });

  test("hides downloads after expiration", () => {
    const mapped = mapRecentExecution(
      conversion({
        expired: true,
        expiresAt: "2026-08-24T11:50:00.000Z",
      }),
      now,
    );

    expect(mapped.status).toBe("expired");
    expect(mapped.canDownload).toBe(false);
    expect(mapped.outputFileId).toBeNull();
  });

  test("maps processing and failed terminal states", () => {
    expect(
      mapRecentExecution(conversion({ status: "queued" }), now).status,
    ).toBe("processing");
    expect(
      mapRecentExecution(
        conversion({ status: "failed", outputFileId: null }),
        now,
      ).status,
    ).toBe("failed");
  });
});
