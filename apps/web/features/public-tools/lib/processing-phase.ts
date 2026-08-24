import type { ConversionStatus } from "@/features/conversions/types/conversion";
import type { WorkspaceFileStatus } from "./workspace-files";

export const TOOL_PROCESSING_PHASES = [
  "idle",
  "uploading",
  "preparing",
  "processing",
  "ready",
  "failed",
] as const;

export type ToolProcessingPhase = (typeof TOOL_PROCESSING_PHASES)[number];

export function resolveToolProcessingPhase(input: {
  hasError: boolean;
  isCreatingConversion: boolean;
  fileStatuses: readonly WorkspaceFileStatus[];
  conversionStatus: ConversionStatus | undefined;
}): ToolProcessingPhase {
  if (input.conversionStatus === "completed") {
    return "ready";
  }

  if (
    input.conversionStatus === "failed" ||
    input.conversionStatus === "cancelled"
  ) {
    return "failed";
  }

  if (input.conversionStatus === "processing") {
    return "processing";
  }

  if (
    input.conversionStatus === "pending" ||
    input.conversionStatus === "queued" ||
    input.isCreatingConversion
  ) {
    return "preparing";
  }

  if (input.fileStatuses.some((status) => status === "uploading")) {
    return "uploading";
  }

  if (input.hasError) {
    return "failed";
  }

  return "idle";
}

export function isIndeterminateProcessingPhase(
  phase: ToolProcessingPhase,
): boolean {
  return phase === "preparing" || phase === "processing";
}
