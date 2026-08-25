import type { ToolUserError } from "../lib/public-tool-errors";
import type { WorkspaceFile } from "../lib/workspace-files";

export const TOOL_UX_STATUSES = [
  "empty",
  "selected",
  "configuring",
  "processing",
  "success",
  "error",
  "expired",
] as const;

export type ToolUxStatus = (typeof TOOL_UX_STATUSES)[number];

export const TOOL_PROCESSING_STATUSES = [
  "starting",
  "queued",
  "processing",
] as const;

export type ToolProcessingStatus = (typeof TOOL_PROCESSING_STATUSES)[number];

export type ToolEmptyUxState = {
  status: "empty";
};

export type ToolSelectedUxState = {
  status: "selected" | "configuring";
  files: readonly WorkspaceFile[];
  error: ToolUserError | null;
};

export type ToolProcessingUxState = {
  status: "processing";
  executionId: string | null;
  processingStatus: ToolProcessingStatus;
  progress: number | null;
};

export type ToolSuccessUxState = {
  status: "success";
  executionId: string;
  targetFormat: string;
  sourceFilename: string | null;
  outputFileId: string;
  expiresAt: string | null;
  downloadError: ToolUserError | null;
};

export type ToolErrorUxState = {
  status: "error";
  executionId: string | null;
  error: ToolUserError;
};

export type ToolExpiredUxState = {
  status: "expired";
  executionId: string | null;
  expiresAt: string | null;
};

export type ToolUxState =
  | ToolEmptyUxState
  | ToolSelectedUxState
  | ToolProcessingUxState
  | ToolSuccessUxState
  | ToolErrorUxState
  | ToolExpiredUxState;

export function isToolUxStatus(value: string): value is ToolUxStatus {
  return TOOL_UX_STATUSES.some((status) => status === value);
}

export function isFileWorkspaceUx(
  state: ToolUxState,
): state is ToolSelectedUxState {
  return state.status === "selected" || state.status === "configuring";
}

export function isToolProcessingStatus(
  value: string,
): value is ToolProcessingStatus {
  return TOOL_PROCESSING_STATUSES.some((status) => status === value);
}
