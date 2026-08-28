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

export const QUEUED_CONVERSION_STALL_MS = 90_000;

export type ResolveToolUxStateInput = {
  toolId: string;
  files: readonly WorkspaceFile[];
  isCreatingExecution: boolean;
  executionId: string | null;
  executionIds?: readonly string[];
  execution: PublicConversion | undefined;
  executions?: readonly PublicConversion[];
  executionQueryError: unknown | null;
  selectionError: PublicToolErrorKey | null;
  processError: PublicToolErrorKey | null;
  downloadError: PublicToolErrorKey | null;
  resultExpired: boolean;
  now: Date;
};

function conversionWaitStartedAt(conversion: PublicConversion): number {
  const queuedAt = conversion.queuedAt ?? conversion.createdAt;
  return new Date(queuedAt).getTime();
}

function isQueuedConversionStalled(
  conversion: PublicConversion,
  now: Date,
): boolean {
  if (conversion.status !== "pending" && conversion.status !== "queued") {
    return false;
  }

  return (
    now.getTime() - conversionWaitStartedAt(conversion) >=
    QUEUED_CONVERSION_STALL_MS
  );
}

function expectedJobCount(input: ResolveToolUxStateInput): number {
  if (input.executionIds !== undefined) {
    return input.executionIds.length;
  }

  if (input.executionId !== null || input.execution !== undefined) {
    return 1;
  }

  return 0;
}

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
  const jobs =
    input.executions ??
    (input.execution === undefined ? [] : [input.execution]);
  const execution = jobs[0] ?? input.execution;
  const executionExpired = jobs.some((job) =>
    isConversionExpired(job, input.now),
  );

  if (input.resultExpired || executionExpired) {
    return {
      status: "expired",
      executionId: execution?.id ?? input.executionId,
      expiresAt: execution?.expiresAt ?? null,
    };
  }

  const failed = jobs.find(
    (job) => job.status === "failed" || job.status === "cancelled",
  );

  if (failed !== undefined) {
    return {
      status: "error",
      executionId: failed.id,
      error: toToolUserError(mapConversionFailure(failed.error)),
    };
  }

  const stalled = jobs.find((job) => isQueuedConversionStalled(job, input.now));

  if (stalled !== undefined) {
    return {
      status: "error",
      executionId: stalled.id,
      error: toToolUserError("processingFailed"),
    };
  }

  const expectedCount = expectedJobCount(input);
  const jobsStillLoading =
    expectedCount > jobs.length && input.executionQueryError === null;
  const allCompleted =
    expectedCount > 0 &&
    jobs.length >= expectedCount &&
    jobs.every((job) => job.status === "completed");

  if (allCompleted) {
    const outputs = jobs.flatMap((job) => {
      if (job.outputFileId === null) {
        return [];
      }

      return [
        {
          executionId: job.id,
          sourceFilename: job.sourceFilename,
          outputFileId: job.outputFileId,
          targetFormat: job.targetFormat,
        },
      ];
    });
    const primary = jobs[0];

    if (primary === undefined || outputs.length !== jobs.length) {
      return {
        status: "expired",
        executionId: primary?.id ?? input.executionId,
        expiresAt: primary?.expiresAt ?? null,
      };
    }

    return {
      status: "success",
      executionId: primary.id,
      targetFormat: primary.targetFormat,
      sourceFilename: primary.sourceFilename,
      outputFileId: outputs[0]?.outputFileId ?? primary.outputFileId ?? "",
      expiresAt: primary.expiresAt,
      downloadError:
        input.downloadError === null
          ? null
          : toToolUserError(input.downloadError),
      outputs,
    };
  }

  if (
    input.isCreatingExecution ||
    jobsStillLoading ||
    jobs.some(
      (job) =>
        job.status === "pending" ||
        job.status === "queued" ||
        job.status === "processing",
    )
  ) {
    const active = jobs.find(
      (job) =>
        job.status === "processing" ||
        job.status === "queued" ||
        job.status === "pending",
    );

    return {
      status: "processing",
      executionId: active?.id ?? execution?.id ?? input.executionId,
      processingStatus: resolveProcessingStatus(
        input.isCreatingExecution,
        active?.status ?? execution?.status,
      ),
      progress: null,
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
