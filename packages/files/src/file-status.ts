import { APP_ERROR_CODES, AppError } from "@repo/core";

export const FILE_STATUSES = [
  "pending",
  "uploaded",
  "processing",
  "completed",
  "failed",
  "deleted",
] as const;

export type FileStatus = (typeof FILE_STATUSES)[number];

const FILE_STATUS_TRANSITIONS: Record<FileStatus, readonly FileStatus[]> = {
  pending: ["uploaded", "failed", "deleted"],
  uploaded: ["processing", "deleted"],
  processing: ["completed", "failed", "deleted"],
  completed: ["deleted"],
  failed: ["deleted"],
  deleted: [],
};

export function isFileStatus(value: string): value is FileStatus {
  return FILE_STATUSES.some((status) => status === value);
}

export function canTransitionFileStatus(
  from: FileStatus,
  to: FileStatus,
): boolean {
  return FILE_STATUS_TRANSITIONS[from].includes(to);
}

export function assertFileStatusTransition(
  from: FileStatus,
  to: FileStatus,
): void {
  if (canTransitionFileStatus(from, to)) {
    return;
  }

  throw new AppError({
    code: APP_ERROR_CODES.CONFLICT,
    message: "Invalid file status transition",
  });
}
