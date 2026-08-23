import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  decodeFileListCursor,
  encodeFileListCursor,
} from "./file-pagination.js";
import type { FileRecord } from "./file-types.js";

const file: FileRecord = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  ownerId: "user_1",
  originalFilename: "report.pdf",
  mimeType: "application/pdf",
  sizeBytes: 10,
  objectKey: "files/550e8400-e29b-41d4-a716-446655440000/original",
  status: "uploaded",
  createdAt: new Date("2026-08-23T18:00:00.000Z"),
  updatedAt: new Date("2026-08-23T18:00:00.000Z"),
  expiresAt: new Date("2026-08-23T20:00:00.000Z"),
  deletedAt: null,
};

describe("file list cursor", () => {
  test("round-trips createdAt and id", () => {
    const encoded = encodeFileListCursor(file);

    expect(decodeFileListCursor(encoded)).toEqual({
      createdAt: file.createdAt,
      id: file.id,
    });
  });

  test("rejects an untrusted cursor", () => {
    try {
      decodeFileListCursor("not-a-cursor");
      throw new Error("expected cursor to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
