import { isConversionExpired } from "@/features/conversions/lib/can-download-conversion";
import type { PublicConversion } from "@/features/conversions/types/conversion";
import type { ToolProcessingStatus, ToolUxState } from "../types/tool-ux-state";
import {
  isExpirationResponse,
  isMissingResourceResponse,
  mapConversionFailure,
  mapPublicToolError,
  type PublicToolErrorKey,
  toToolUserError,
} from "./public-tool-errors";
import { toolRequiresConfiguration } from "./tool-requires-configuration";
import type { WorkspaceFile } from "./workspace-files";

export type ResolveToolUxStateInput = {
  toolId: string;
  files: readonly WorkspaceFile[];
  isCreatingExecution: boolean;
  executionId: string | null;
  execution: PublicConversion | undefined;
  executionQueryError: unknown | null;
  selectionError: PublicToolErrorKey | null;
  processError: PublicToolErrorKey | null;
  downloadError: PublicToolErrorKey | null;
  resultExpired: boolean;
  now: Date;
};

export function resolveProcessingStatus(
  isCreatingExecution: boolean,
  conversionStatus: PublicConversion["status"] | undefined,
): ToolProcessingStatus {
  if (conversionStatus === "processing") {
    return "processing";
  }

  if (conversionStatus === "pending" || conversionStatus === "queued") {
    return "queued";
  }

  if (isCreatingExecution) {
    return "starting";
  }

  return "starting";
}

export function resolveToolUxState(
  input: ResolveToolUxStateInput,
): ToolUxState {
  const execution = input.execution;
  const executionExpired =
    execution !== undefined && isConversionExpired(execution, input.now);

  if (input.resultExpired || executionExpired) {
    return {
      status: "expired",
      executionId: execution?.id ?? input.executionId,
      expiresAt: execution?.expiresAt ?? null,
    };
  }

  if (input.processError !== null) {
    return {
      status: "error",
      executionId: execution?.id ?? input.executionId,
      error: toToolUserError(input.processError),
    };
  }

  if (input.executionQueryError !== null && input.executionId !== null) {
    if (
      isExpirationResponse(input.executionQueryError) ||
      isMissingResourceResponse(input.executionQueryError)
    ) {
      return {
        status: "expired",
        executionId: input.executionId,
        expiresAt: execution?.expiresAt ?? null,
      };
    }

    return {
      status: "error",
      executionId: input.executionId,
      error: toToolUserError(mapPublicToolError(input.executionQueryError)),
    };
  }

  if (execution?.status === "completed") {
    if (execution.outputFileId === null) {
      return {
        status: "expired",
        executionId: execution.id,
        expiresAt: execution.expiresAt,
      };
    }

    return {
      status: "success",
      executionId: execution.id,
      targetFormat: execution.targetFormat,
      sourceFilename: execution.sourceFilename,
      outputFileId: execution.outputFileId,
      expiresAt: execution.expiresAt,
      downloadError:
        input.downloadError === null
          ? null
          : toToolUserError(input.downloadError),
    };
  }

  if (execution?.status === "failed" || execution?.status === "cancelled") {
    return {
      status: "error",
      executionId: execution.id,
      error: toToolUserError(mapConversionFailure(execution.error)),
    };
  }

  if (
    input.isCreatingExecution ||
    execution?.status === "pending" ||
    execution?.status === "queued" ||
    execution?.status === "processing"
  ) {
    return {
      status: "processing",
      executionId: execution?.id ?? null,
      processingStatus: resolveProcessingStatus(
        input.isCreatingExecution,
        execution?.status,
      ),
      progress: null,
    };
  }

  if (input.files.length > 0) {
    return {
      status: toolRequiresConfiguration(input.toolId)
        ? "configuring"
        : "selected",
      files: input.files,
      error:
        input.selectionError === null
          ? null
          : toToolUserError(input.selectionError),
    };
  }

  return { status: "empty" };
}
