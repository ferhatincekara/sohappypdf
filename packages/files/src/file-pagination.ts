import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { FileRecord } from "./file-types.js";

export const DEFAULT_FILE_LIST_LIMIT = 20;
export const MAX_FILE_LIST_LIMIT = 50;

export type FileListCursor = {
  createdAt: Date;
  id: string;
};

export function encodeFileListCursor(file: FileRecord): string {
  return Buffer.from(
    `${file.createdAt.toISOString()}|${file.id}`,
    "utf8",
  ).toString("base64url");
}

export function decodeFileListCursor(cursor: string): FileListCursor {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const separator = decoded.lastIndexOf("|");
    const createdAtValue = decoded.slice(0, separator);
    const id = decoded.slice(separator + 1);
    const createdAt = new Date(createdAtValue);

    if (separator < 1 || id.length === 0 || Number.isNaN(createdAt.getTime())) {
      throw new Error("invalid cursor");
    }

    return { createdAt, id };
  } catch {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid pagination cursor",
    });
  }
}

export function assertFileListLimit(limit: number | undefined): number {
  const value = limit ?? DEFAULT_FILE_LIST_LIMIT;

  if (!Number.isInteger(value) || value < 1 || value > MAX_FILE_LIST_LIMIT) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid page size",
    });
  }

  return value;
}
