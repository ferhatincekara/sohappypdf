import { describe, expect, test } from "bun:test";
import {
  formatFromPublicFile,
  getFileInputAccept,
  isSupportedUploadExtension,
  isSupportedUploadMimeType,
  listSupportedUploadExtensions,
  listSupportedUploadMimeTypes,
  mimeTypeFromFilename,
  resolveUploadContentType,
} from "./supported-upload-types";

describe("supported upload types", () => {
  test("includes conversion source MIME types and not invented formats", () => {
    const mimeTypes = listSupportedUploadMimeTypes();

    expect(mimeTypes).toContain("application/pdf");
    expect(mimeTypes).toContain("application/msword");
    expect(mimeTypes).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(mimeTypes).toContain("image/jpeg");
    expect(mimeTypes).toContain("image/png");
    expect(mimeTypes).not.toContain("image/webp");
    expect(mimeTypes).not.toContain("text/plain");
    expect(mimeTypes).not.toContain("application/zip");
  });

  test("accepts jpeg as a jpg alias and rejects unsupported extensions", () => {
    expect(isSupportedUploadExtension("photo.JPEG")).toBe(true);
    expect(isSupportedUploadExtension("notes.txt")).toBe(false);
    expect(isSupportedUploadExtension("archive.zip")).toBe(false);
    expect(mimeTypeFromFilename("photo.JPEG")).toBe("image/jpeg");
  });

  test("resolves a content type from MIME or extension", () => {
    expect(
      resolveUploadContentType({
        name: "report.bin",
        type: "application/pdf",
      }),
    ).toBe("application/pdf");
    expect(
      resolveUploadContentType({
        name: "report.pdf",
        type: "",
      }),
    ).toBe("application/pdf");
    expect(
      resolveUploadContentType({
        name: "report.bin",
        type: "application/octet-stream",
      }),
    ).toBeUndefined();
  });

  test("builds a single accept list for the file picker", () => {
    const accept = getFileInputAccept();

    expect(accept).toContain("application/pdf");
    expect(accept).toContain(".pdf");
    expect(accept).toContain(".jpeg");
    expect(listSupportedUploadExtensions()).toContain(".docx");
    expect(isSupportedUploadMimeType("application/pdf; charset=binary")).toBe(
      true,
    );
  });

  test("resolves a safe file type label from MIME or extension", () => {
    expect(
      formatFromPublicFile({
        contentType: "application/pdf",
        filename: "notes.bin",
      }),
    ).toBe("pdf");
    expect(
      formatFromPublicFile({
        contentType: "application/octet-stream",
        filename: "photo.JPEG",
      }),
    ).toBe("jpg");
  });
});
