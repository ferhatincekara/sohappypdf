import { APP_ERROR_CODES, AppError } from "@repo/core";
import { FILE_CLEANUP_JOB_NAME } from "./queue-settings.js";

export type FileCleanupJobData = Record<string, never>;

function invalidPayload(): AppError {
  return new AppError({
    code: APP_ERROR_CODES.VALIDATION_ERROR,
    message: "Invalid file cleanup job payload",
  });
}

export function parseFileCleanupJobData(value: unknown): FileCleanupJobData {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalidPayload();
  }

  const keys = Object.keys(value);

  if (keys.length > 0) {
    throw invalidPayload();
  }

  return {};
}

export function createFileCleanupJob(): {
  name: typeof FILE_CLEANUP_JOB_NAME;
  data: FileCleanupJobData;
} {
  return {
    name: FILE_CLEANUP_JOB_NAME,
    data: {},
  };
}
