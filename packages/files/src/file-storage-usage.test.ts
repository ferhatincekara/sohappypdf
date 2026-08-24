import { describe, expect, test } from "bun:test";
import { sumActiveStorageBytesForOwner } from "./file-storage-usage.js";
import type { FileRecord } from "./file-types.js";

function file(overrides: Partial<FileRecord>): FileRecord {
  return {
    id: "file_1",
    ownerId: "user_1",
    originalFilename: "report.pdf",
    mimeType: "application/pdf",
    sizeBytes: 100,
    objectKey: "files/original/file_1",
    status: "uploaded",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    expiresAt: new Date("2026-08-20T00:00:00.000Z"),
    deletedAt: null,
    purgedAt: null,
    ...overrides,
  };
}

describe("sumActiveStorageBytesForOwner", () => {
  const now = new Date("2026-08-15T00:00:00.000Z");

  test("includes pending files and excludes deleted or expired files", () => {
    const total = sumActiveStorageBytesForOwner(
      [
        file({ id: "pending", status: "pending", sizeBytes: 10 }),
        file({ id: "uploaded", status: "uploaded", sizeBytes: 20 }),
        file({ id: "deleted", status: "deleted", sizeBytes: 40 }),
        file({
          id: "expired",
          sizeBytes: 80,
          expiresAt: new Date("2026-08-01T00:00:00.000Z"),
        }),
        file({ id: "other", ownerId: "user_2", sizeBytes: 160 }),
      ],
      "user_1",
      now,
    );

    expect(total).toBe(30);
  });
});
