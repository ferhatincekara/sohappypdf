import { describe, expect, test } from "bun:test";
import type { PublicFile } from "@/features/files/types/file";
import { isFileConvertible } from "./is-file-convertible";

function createFile(overrides: Partial<PublicFile> = {}): PublicFile {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    filename: "report.pdf",
    contentType: "application/pdf",
    size: 8,
    status: "uploaded",
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2026-08-24T02:00:00.000Z",
    ...overrides,
  };
}

describe("isFileConvertible", () => {
  test("allows uploaded PDFs that the backend can convert", () => {
    expect(isFileConvertible(createFile())).toBe(true);
  });

  test("hides convert for pending or failed files", () => {
    expect(isFileConvertible(createFile({ status: "pending" }))).toBe(false);
    expect(isFileConvertible(createFile({ status: "failed" }))).toBe(false);
  });

  test("hides convert when no implemented conversion exists", () => {
    expect(
      isFileConvertible(
        createFile({
          filename: "notes.docx",
          contentType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      ),
    ).toBe(false);
  });
});
