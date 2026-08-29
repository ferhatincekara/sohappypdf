import { describe, expect, test } from "bun:test";
import { isFileDeletable } from "@/features/files/lib/is-file-deletable";
import type { PublicFile } from "@/features/files/types/file";

function createFile(status: PublicFile["status"]): PublicFile {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    filename: "report.pdf",
    contentType: "application/pdf",
    size: 128,
    status,
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2026-08-24T02:00:00.000Z",
  };
}

describe("isFileDeletable", () => {
  test("allows stored files and hides already deleted ones", () => {
    expect(isFileDeletable(createFile("uploaded"))).toBe(true);
    expect(isFileDeletable(createFile("failed"))).toBe(true);
    expect(isFileDeletable(createFile("deleted"))).toBe(false);
  });
});
