import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  DEFAULT_FILE_RETENTION_MS,
  FILE_EXPIRED_MESSAGE,
  getFileExpirationDate,
  isEligibleForCleanup,
  isFileExpired,
  remainingFileTtlMs,
  resolveTemporaryFileLifecycleState,
  throwIfOwnedFileExpired,
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
    purgedAt: null,
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
    expect(
      isEligibleForCleanup(
        createFile({
          purgedAt: new Date("2026-08-23T17:00:00.000Z"),
          expiresAt: new Date("2026-08-23T17:00:00.000Z"),
        }),
        now,
      ),
    ).toBe(false);
  });

  test("returns remaining TTL until expiry", () => {
    const file = createFile();

    expect(remainingFileTtlMs(file, new Date("2026-08-23T19:00:00.000Z"))).toBe(
      60 * 60 * 1000,
    );
    expect(remainingFileTtlMs(file, new Date("2026-08-23T21:00:00.000Z"))).toBe(
      1,
    );
  });

  test("maps temporary file lifecycle states without exposing storage details", () => {
    const now = new Date("2026-08-23T18:00:00.000Z");

    expect(resolveTemporaryFileLifecycleState(createFile(), now)).toBe(
      "ACTIVE",
    );
    expect(
      resolveTemporaryFileLifecycleState(
        createFile({ status: "processing" }),
        now,
      ),
    ).toBe("PROCESSING");
    expect(
      resolveTemporaryFileLifecycleState(
        createFile({ status: "completed" }),
        now,
      ),
    ).toBe("READY");
    expect(
      resolveTemporaryFileLifecycleState(createFile({ status: "failed" }), now),
    ).toBe("FAILED");
    expect(
      resolveTemporaryFileLifecycleState(
        createFile({
          status: "processing",
          expiresAt: new Date("2026-08-23T17:00:00.000Z"),
        }),
        now,
      ),
    ).toBe("EXPIRED");
  });

  test("expired incomplete, stuck, and failed files are eligible for cleanup", () => {
    const now = new Date("2026-08-23T18:00:00.000Z");
    const expiredAt = new Date("2026-08-23T17:00:00.000Z");

    expect(
      isEligibleForCleanup(
        createFile({ status: "pending", expiresAt: expiredAt }),
        now,
      ),
    ).toBe(true);
    expect(
      isEligibleForCleanup(
        createFile({ status: "processing", expiresAt: expiredAt }),
        now,
      ),
    ).toBe(true);
    expect(
      isEligibleForCleanup(
        createFile({ status: "failed", expiresAt: expiredAt }),
        now,
      ),
    ).toBe(true);
  });

  test("throws a product-level expiry error for owned expired files", () => {
    try {
      throwIfOwnedFileExpired(
        createFile({ expiresAt: new Date("2026-08-23T17:00:00.000Z") }),
        new Date("2026-08-23T18:00:00.000Z"),
      );
      throw new Error("expected expired file to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("FILE_EXPIRED");
        expect(error.message).toBe(FILE_EXPIRED_MESSAGE);
      }
    }
  });
});
