export const TOOL_EXECUTION_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
  "expired",
] as const;

export type ToolExecutionStatus = (typeof TOOL_EXECUTION_STATUSES)[number];

export function isToolExecutionStatus(
  value: string,
): value is ToolExecutionStatus {
  return TOOL_EXECUTION_STATUSES.some((status) => status === value);
}
