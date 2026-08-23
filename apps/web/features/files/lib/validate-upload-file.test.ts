import { describe, expect, test } from "bun:test";
import { DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES } from "@/config/public-env";
import {
  UPLOAD_VALIDATION_KEYS,
  validateSelectedFiles,
  validateUploadFile,
} from "./validate-upload-file";

function createBrowserFile(name: string, type: string, size = 32): File {
  const file = new File([new Uint8Array(size > 0 ? 1 : 0)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateUploadFile", () => {
  test("accepts a supported file under the public size limit", () => {
    const result = validateUploadFile(
      createBrowserFile("report.pdf", "application/pdf", 2048),
    );

    expect(result).toEqual({ ok: true, contentType: "application/pdf" });
  });

  test("rejects a missing file and multiple files", () => {
    expect(validateSelectedFiles(null)).toEqual({
      ok: false,
      errorKey: UPLOAD_VALIDATION_KEYS.missingFile,
    });
    expect(
      validateSelectedFiles([
        createBrowserFile("one.pdf", "application/pdf"),
        createBrowserFile("two.pdf", "application/pdf"),
      ]),
    ).toEqual({
      ok: false,
      errorKey: UPLOAD_VALIDATION_KEYS.multipleFiles,
    });
  });

  test("rejects unsupported types, empty files, and oversized files", () => {
    expect(
      validateUploadFile(createBrowserFile("notes.txt", "text/plain")),
    ).toEqual({
      ok: false,
      errorKey: UPLOAD_VALIDATION_KEYS.unsupportedType,
    });
    expect(
      validateUploadFile(createBrowserFile("empty.pdf", "application/pdf", 0)),
    ).toEqual({
      ok: false,
      errorKey: UPLOAD_VALIDATION_KEYS.emptyFile,
    });
    expect(
      validateUploadFile(
        createBrowserFile(
          "huge.pdf",
          "application/pdf",
          DEFAULT_MAX_UPLOAD_FILE_SIZE_BYTES + 1,
        ),
      ),
    ).toEqual({
      ok: false,
      errorKey: UPLOAD_VALIDATION_KEYS.fileTooLarge,
    });
  });

  test("rejects unsafe filenames and uses the provided size limit", () => {
    expect(
      validateUploadFile(createBrowserFile("../secret.pdf", "application/pdf")),
    ).toEqual({
      ok: false,
      errorKey: UPLOAD_VALIDATION_KEYS.invalidFilename,
    });
    expect(
      validateUploadFile(
        createBrowserFile("report.pdf", "application/pdf", 21),
        20,
      ),
    ).toEqual({
      ok: false,
      errorKey: UPLOAD_VALIDATION_KEYS.fileTooLarge,
    });
  });

  test("infers a supported type from the extension when MIME is missing", () => {
    expect(validateUploadFile(createBrowserFile("slides.pptx", ""))).toEqual({
      ok: true,
      contentType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
  });
});
