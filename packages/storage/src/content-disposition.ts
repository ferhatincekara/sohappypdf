import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";

const MAX_DISPOSITION_FILENAME_LENGTH = 255;

export function toAttachmentContentDisposition(filename: string): string {
  if (
    filename.length === 0 ||
    filename.length > MAX_DISPOSITION_FILENAME_LENGTH ||
    /[\r\n]/.test(filename)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid download filename",
    });
  }

  const fallback =
    filename.replace(/[^\w.-]+/g, "_").slice(0, 255) || "download";

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
