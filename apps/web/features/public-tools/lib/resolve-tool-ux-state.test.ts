import { describe, expect, test } from "bun:test";
import type { PublicConversion } from "@/features/conversions/types/conversion";
import { INITIAL_UPLOAD_PROGRESS } from "@/features/files/types/upload-state";
import { resolveToolUxState } from "@/features/public-tools/lib/resolve-tool-ux-state";
import type { WorkspaceFile } from "@/features/public-tools/lib/workspace-files";
import { isToolUxStatus } from "@/features/public-tools/types/tool-ux-state";

function createFile(overrides: Partial<WorkspaceFile> = {}): WorkspaceFile {
  return {
    id: "file-1",
    file: new File(["a"], "a.pdf", { type: "application/pdf" }),
    previewUrl: null,
    status: "ready",
    progress: INITIAL_UPLOAD_PROGRESS,
    publicFile: null,
    errorKey: null,
    ...overrides,
  };
}

function createExecution(
  overrides: Partial<PublicConversion> = {},
): PublicConversion {
  return {
    id: "exec-1",
    status: "queued",
    sourceFileId: "file-1",
    sourceFilename: "a.pdf",
    outputFileId: null,
    type: "compress-pdf",
    sourceFormat: "pdf",
    targetFormat: "pdf",
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    queuedAt: "2026-08-24T00:00:01.000Z",
    startedAt: null,
    completedAt: null,
    expiresAt: "2026-08-24T02:00:00.000Z",
    expired: false,
    ...overrides,
  };
}

const baseInput = {
  toolId: "merge-pdf",
  files: [] as WorkspaceFile[],
  isCreatingExecution: false,
  executionId: null as string | null,
  execution: undefined as PublicConversion | undefined,
  executionQueryError: null as unknown,
  selectionError: null,
  processError: null,
  downloadError: null,
  resultExpired: false,
  now: new Date("2026-08-24T00:00:10.000Z"),
};

describe("tool UX state model", () => {
  test("uses a closed set of statuses", () => {
    expect(isToolUxStatus("empty")).toBe(true);
    expect(isToolUxStatus("selected")).toBe(true);
    expect(isToolUxStatus("configuring")).toBe(true);
    expect(isToolUxStatus("processing")).toBe(true);
    expect(isToolUxStatus("success")).toBe(true);
    expect(isToolUxStatus("error")).toBe(true);
    expect(isToolUxStatus("expired")).toBe(true);
    expect(isToolUxStatus("uploading")).toBe(false);
    expect(isToolUxStatus("ready")).toBe(false);
  });

  test("starts empty when no files or execution exist", () => {
    expect(resolveToolUxState(baseInput)).toEqual({ status: "empty" });
  });

  test("enters selected with files when the tool has no extra options", () => {
    const state = resolveToolUxState({
      ...baseInput,
      toolId: "repair-pdf",
      files: [createFile()],
      selectionError: "tooManyFiles",
    });

    expect(state.status).toBe("selected");
    if (state.status !== "selected") {
      throw new Error("expected selected");
    }
    expect(state.files).toHaveLength(1);
    expect(state.error).toEqual({
      key: "tooManyFiles",
      retryable: false,
    });
  });

  test("enters configuring when files are selected for an options workspace", () => {
    const state = resolveToolUxState({
      ...baseInput,
      files: [createFile()],
    });

    expect(state.status).toBe("configuring");
  });

  test("enters processing while creating or running an execution", () => {
    expect(
      resolveToolUxState({
        ...baseInput,
        files: [createFile()],
        isCreatingExecution: true,
      }).status,
    ).toBe("processing");

    const queued = resolveToolUxState({
      ...baseInput,
      files: [createFile()],
      executionId: "exec-1",
      execution: createExecution({ status: "queued" }),
    });
    expect(queued).toMatchObject({
      status: "processing",
      executionId: "exec-1",
      processingStatus: "queued",
      progress: null,
    });

    const processing = resolveToolUxState({
      ...baseInput,
      executionId: "exec-1",
      execution: createExecution({ status: "processing" }),
    });
    expect(processing).toMatchObject({
      status: "processing",
      processingStatus: "processing",
      progress: null,
    });
  });

  test("stays in processing while an execution id exists without status data yet", () => {
    const state = resolveToolUxState({
      ...baseInput,
      files: [createFile()],
      executionId: "exec-1",
      executionIds: ["exec-1"],
    });

    expect(state).toMatchObject({
      status: "processing",
      executionId: "exec-1",
      processingStatus: "starting",
      progress: null,
    });
  });

  test("does not treat a partial batch as success", () => {
    const state = resolveToolUxState({
      ...baseInput,
      executionId: "exec-1",
      executionIds: ["exec-1", "exec-2"],
      executions: [
        createExecution({
          status: "completed",
          outputFileId: "out-1",
          completedAt: "2026-08-24T00:05:00.000Z",
        }),
      ],
    });

    expect(state.status).toBe("processing");
  });

  test("enters success only after every expected job is completed", () => {
    const state = resolveToolUxState({
      ...baseInput,
      executionId: "exec-1",
      executionIds: ["exec-1", "exec-2"],
      executions: [
        createExecution({
          id: "exec-1",
          status: "completed",
          outputFileId: "out-1",
          completedAt: "2026-08-24T00:05:00.000Z",
        }),
        createExecution({
          id: "exec-2",
          status: "completed",
          sourceFilename: "b.pdf",
          outputFileId: "out-2",
          completedAt: "2026-08-24T00:05:01.000Z",
        }),
      ],
    });

    expect(state.status).toBe("success");
    if (state.status !== "success") {
      throw new Error("expected success");
    }
    expect(state.outputs).toHaveLength(2);
  });

  test("enters success with download metadata and never invents progress", () => {
    const state = resolveToolUxState({
      ...baseInput,
      executionId: "exec-1",
      execution: createExecution({
        status: "completed",
        outputFileId: "out-1",
        completedAt: "2026-08-24T00:05:00.000Z",
      }),
    });

    expect(state).toEqual({
      status: "success",
      executionId: "exec-1",
      targetFormat: "pdf",
      sourceFilename: "a.pdf",
      outputFileId: "out-1",
      expiresAt: "2026-08-24T02:00:00.000Z",
      downloadError: null,
      outputs: [
        {
          executionId: "exec-1",
          sourceFilename: "a.pdf",
          outputFileId: "out-1",
          targetFormat: "pdf",
        },
      ],
    });
  });

  test("enters error for failed processing with retry capability", () => {
    const state = resolveToolUxState({
      ...baseInput,
      executionId: "exec-1",
      execution: createExecution({
        status: "failed",
        error: { code: "processing_failed", message: "engine crashed" },
      }),
    });

    expect(state.status).toBe("error");
    if (state.status !== "error") {
      throw new Error("expected error");
    }
    expect(state.error).toEqual({
      key: "processingFailed",
      retryable: true,
    });
    expect(JSON.stringify(state)).not.toContain("engine crashed");
  });

  test("keeps a known execution result when a later status fetch fails", () => {
    const completed = resolveToolUxState({
      ...baseInput,
      executionId: "exec-1",
      execution: createExecution({
        status: "completed",
        outputFileId: "out-1",
        completedAt: "2026-08-24T00:05:00.000Z",
      }),
      executionQueryError: new Error("status fetch failed"),
      processError: "unexpected",
    });

    expect(completed.status).toBe("success");
    if (completed.status !== "success") {
      throw new Error("expected success");
    }
    expect(completed.outputFileId).toBe("out-1");

    const queued = resolveToolUxState({
      ...baseInput,
      executionId: "exec-1",
      execution: createExecution({ status: "queued" }),
      executionQueryError: new Error("status fetch failed"),
    });
    expect(queued.status).toBe("processing");
  });

  test("treats a conversion that stays queued as a retryable failure", () => {
    const state = resolveToolUxState({
      ...baseInput,
      now: new Date("2026-08-24T00:02:00.000Z"),
      executionId: "exec-1",
      execution: createExecution({ status: "queued" }),
    });

    expect(state.status).toBe("error");
    if (state.status !== "error") {
      throw new Error("expected error");
    }
    expect(state.error).toEqual({
      key: "processingFailed",
      retryable: true,
    });
  });

  test("treats expiration as a first-class state", () => {
    const byFlag = resolveToolUxState({
      ...baseInput,
      executionId: "exec-1",
      execution: createExecution({
        status: "completed",
        outputFileId: null,
        expired: true,
      }),
    });
    expect(byFlag.status).toBe("expired");

    const byClock = resolveToolUxState({
      ...baseInput,
      now: new Date("2026-08-24T03:00:00.000Z"),
      executionId: "exec-1",
      execution: createExecution({
        status: "completed",
        outputFileId: "out-1",
        expiresAt: "2026-08-24T02:00:00.000Z",
      }),
    });
    expect(byClock.status).toBe("expired");

    const byDownload = resolveToolUxState({
      ...baseInput,
      executionId: "exec-1",
      execution: createExecution({
        status: "completed",
        outputFileId: "out-1",
      }),
      resultExpired: true,
    });
    expect(byDownload.status).toBe("expired");
  });
});
