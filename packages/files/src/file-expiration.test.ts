import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  DEFAULT_FILE_RETENTION_MS,
  getFileExpirationDate,
  isEligibleForCleanup,
  isFileExpired,
} from "./file-expiration.js";
import type { FileRecord } from "./file-types.js";

function createFile(overrides: Partial<FileRecord> = {}): FileRecord {
  const now = new Date("2026-08-23T18:00:00.000Z");

  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    ownerId: "user_1",
    originalFilename: "report.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    objectKey: "files/550e8400-e29b-41d4-a716-446655440000/original",
    status: "uploaded",
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date("2026-08-23T20:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };
}

describe("file expiration", () => {
  test("calculates expiresAt from createdAt plus the retention policy", () => {
    const createdAt = new Date("2026-08-23T18:00:00.000Z");

    expect(getFileExpirationDate({ createdAt }).toISOString()).toBe(
      "2026-08-23T20:00:00.000Z",
    );
    expect(DEFAULT_FILE_RETENTION_MS).toBe(2 * 60 * 60 * 1000);
    expect(
      getFileExpirationDate({
        createdAt,
        retentionMs: 24 * 60 * 60 * 1000,
      }).toISOString(),
    ).toBe("2026-08-24T18:00:00.000Z");
  });

  test("rejects an invalid retention duration", () => {
    try {
      getFileExpirationDate({
        createdAt: new Date("2026-08-23T18:00:00.000Z"),
        retentionMs: 0,
      });
      throw new Error("expected retention to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });

  test("treats a file as expired at or after expiresAt", () => {
    const file = createFile();

    expect(isFileExpired(file, new Date("2026-08-23T19:59:59.000Z"))).toBe(
      false,
    );
    expect(isFileExpired(file, new Date("2026-08-23T20:00:00.000Z"))).toBe(
      true,
    );
  });

  test("cleanup eligibility includes expired and already deleted files", () => {
    const expired = createFile({
      expiresAt: new Date("2026-08-23T17:00:00.000Z"),
    });
    const deleted = createFile({
      status: "deleted",
      deletedAt: new Date("2026-08-23T17:30:00.000Z"),
      expiresAt: new Date("2026-08-23T21:00:00.000Z"),
    });
    const now = new Date("2026-08-23T18:00:00.000Z");

    expect(isEligibleForCleanup(expired, now)).toBe(true);
    expect(isEligibleForCleanup(deleted, now)).toBe(true);
    expect(isEligibleForCleanup(createFile(), now)).toBe(false);
  });
});
