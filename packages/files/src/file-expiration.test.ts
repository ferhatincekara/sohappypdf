import { describe, expect, test } from "bun:test";
import { isEligibleForCleanup, isFileExpired } from "./file-expiration.js";
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
  test("treats a file as expired at or after expiresAt", () => {
    const file = createFile();

    expect(isFileExpired(file, new Date("2026-08-23T19:59:59.000Z"))).toBe(
      false,
    );
    expect(isFileExpired(file, new Date("2026-08-23T20:00:00.000Z"))).toBe(
      true,
    );
  });

  test("cleanup eligibility requires expiration and a non-deleted status", () => {
    const expired = createFile({
      expiresAt: new Date("2026-08-23T17:00:00.000Z"),
    });
    const deleted = createFile({
      status: "deleted",
      deletedAt: new Date("2026-08-23T17:30:00.000Z"),
      expiresAt: new Date("2026-08-23T17:00:00.000Z"),
    });
    const now = new Date("2026-08-23T18:00:00.000Z");

    expect(isEligibleForCleanup(expired, now)).toBe(true);
    expect(isEligibleForCleanup(deleted, now)).toBe(false);
    expect(isEligibleForCleanup(createFile(), now)).toBe(false);
  });
});
