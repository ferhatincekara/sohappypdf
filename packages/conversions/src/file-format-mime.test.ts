import { describe, expect, test } from "bun:test";
import {
  fileFormatFromMimeType,
  isSupportedUploadMimeType,
  listSupportedUploadMimeTypes,
  mimeTypeForFileFormat,
} from "./file-format-mime.js";

describe("upload MIME types", () => {
  test("accepts conversion source types and rejects unused catalog types", () => {
    const supported = listSupportedUploadMimeTypes();

    expect(supported).toContain("application/pdf");
    expect(supported).toContain("image/png");
    expect(supported).toContain("image/jpeg");
    expect(supported).not.toContain("image/webp");
    expect(supported).not.toContain("text/plain");
    expect(isSupportedUploadMimeType("application/pdf")).toBe(true);
    expect(isSupportedUploadMimeType("image/webp")).toBe(false);
    expect(fileFormatFromMimeType("image/jpeg")).toBe("jpg");
    expect(mimeTypeForFileFormat("jpg")).toBe("image/jpeg");
    expect(mimeTypeForFileFormat("pdf")).toBe("application/pdf");
    expect(mimeTypeForFileFormat("docx")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });
});
