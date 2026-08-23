import { APP_ERROR_CODES, AppError } from "@repo/core";

const MAX_OBJECT_KEY_LENGTH = 1024;
const SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;

function assertValidSegment(segment: string): void {
  if (segment === "." || segment === ".." || !SEGMENT_PATTERN.test(segment)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid object key segment",
    });
  }
}

export function assertValidObjectKey(key: string): string {
  if (key.length === 0 || key.length > MAX_OBJECT_KEY_LENGTH) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid object key",
    });
  }

  for (const segment of key.split("/")) {
    assertValidSegment(segment);
  }

  return key;
}

export function createObjectKey(segments: readonly string[]): string {
  if (segments.length === 0) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Object key must have at least one segment",
    });
  }

  return assertValidObjectKey(segments.join("/"));
}

export function createFileOriginalKey(fileId: string): string {
  return createObjectKey(["files", fileId, "original"]);
}

export function createFileOutputKey(
  fileId: string,
  conversionId: string,
): string {
  return createObjectKey(["files", fileId, "output", conversionId]);
}
