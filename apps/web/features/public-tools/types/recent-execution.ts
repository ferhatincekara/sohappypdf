import type { ConversionType } from "@/features/conversions/types/conversion";

export const RECENT_EXECUTION_STATUSES = [
  "processing",
  "completed",
  "failed",
  "expired",
] as const;

export type RecentExecutionStatus = (typeof RECENT_EXECUTION_STATUSES)[number];

export type RecentExecution = {
  id: string;
  toolId: ConversionType;
  toolRoute: `/${string}`;
  sourceFilename: string | null;
  createdAt: string;
  expiresAt: string | null;
  status: RecentExecutionStatus;
  canDownload: boolean;
  outputFileId: string | null;
};

export function isRecentExecutionStatus(
  value: string,
): value is RecentExecutionStatus {
  return RECENT_EXECUTION_STATUSES.some((status) => status === value);
}
