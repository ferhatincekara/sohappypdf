import { describe, expect, test } from "bun:test";
import { isFileDownloadable } from "@/features/files/lib/is-file-downloadable";
import type { PublicFile } from "@/features/files/types/file";

function createFile(status: PublicFile["status"]): PublicFile {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    filename: "output.pdf",
    contentType: "application/pdf",
    size: 128,
    status,
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2026-08-24T02:00:00.000Z",
  };
}

describe("isFileDownloadable", () => {
  test("allows stored files and rejects incomplete ones", () => {
    expect(isFileDownloadable(createFile("uploaded"))).toBe(true);
    expect(isFileDownloadable(createFile("completed"))).toBe(true);
    expect(isFileDownloadable(createFile("pending"))).toBe(false);
    expect(isFileDownloadable(createFile("failed"))).toBe(false);
  });
});
