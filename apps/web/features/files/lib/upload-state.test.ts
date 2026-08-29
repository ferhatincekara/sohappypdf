import { describe, expect, test } from "bun:test";
import { FILE_ERROR_KEYS } from "@/features/files/api/file-errors";
import {
  isPresignedUploadExpired,
  reduceUploadState,
  resolveRetryAction,
  toPreparedUpload,
} from "@/features/files/lib/upload-state";
import type { PublicFile } from "@/features/files/types/file";
import {
  createInitialUploadState,
  type FileUploadState,
  type PreparedUpload,
} from "@/features/files/types/upload-state";

function createFile(): File {
  return new File([new Uint8Array(8)], "report.pdf", {
    type: "application/pdf",
  });
}

function createPublicFile(
  status: PublicFile["status"] = "pending",
): PublicFile {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    filename: "report.pdf",
    contentType: "application/pdf",
    size: 8,
    status,
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    expiresAt: "2026-08-24T02:00:00.000Z",
  };
}

function createUpload(expiresAtMs = Date.now() + 60_000): PreparedUpload {
  return {
    url: "https://storage.example.test/upload",
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    expiresInSeconds: 60,
    expiresAtMs,
  };
}

function acceptedState(): FileUploadState {
  return reduceUploadState(createInitialUploadState(), {
    type: "file-accepted",
    file: createFile(),
    contentType: "application/pdf",
  });
}

describe("upload state", () => {
  test("moves through prepare, upload, finalize, and completed", () => {
    let state = acceptedState();
    expect(state.status).toBe("preparing");

    state = reduceUploadState(state, {
      type: "prepared",
      publicFile: createPublicFile(),
      upload: createUpload(),
    });
    expect(state.status).toBe("uploading");

    state = reduceUploadState(state, {
      type: "progress",
      progress: { loaded: 4, total: 8, percent: 50 },
    });
    expect(state.progress.percent).toBe(50);

    state = reduceUploadState(state, { type: "finalizing" });
    expect(state.status).toBe("finalizing");
    expect(state.progress.percent).toBe(100);

    state = reduceUploadState(state, {
      type: "completed",
      publicFile: createPublicFile("uploaded"),
    });
    expect(state.status).toBe("completed");
    expect(state.upload).toBeNull();
    expect(state.publicFile?.status).toBe("uploaded");
  });

  test("records failure and cancellation without boolean flags", () => {
    const uploading = reduceUploadState(acceptedState(), {
      type: "prepared",
      publicFile: createPublicFile(),
      upload: createUpload(),
    });

    expect(
      reduceUploadState(uploading, {
        type: "failed",
        stage: "uploading",
        errorKey: FILE_ERROR_KEYS.networkFailure,
      }),
    ).toMatchObject({
      status: "failed",
      failureStage: "uploading",
      errorKey: FILE_ERROR_KEYS.networkFailure,
    });

    expect(
      reduceUploadState(uploading, {
        type: "cancelled",
        stage: "uploading",
      }),
    ).toMatchObject({
      status: "cancelled",
      failureStage: "uploading",
      errorKey: null,
    });
  });

  test("retries the failed stage and requests a new URL when expired", () => {
    const file = createFile();
    const upload = createUpload(Date.now() + 60_000);
    const expired = createUpload(Date.now() - 1_000);
    const base: FileUploadState = {
      ...acceptedState(),
      selectedFile: file,
      publicFile: createPublicFile(),
      upload,
      status: "failed",
    };

    expect(
      resolveRetryAction({
        ...base,
        failureStage: "validation",
        errorKey: FILE_ERROR_KEYS.unsupportedType,
      }),
    ).toBeNull();
    expect(
      resolveRetryAction({
        ...base,
        failureStage: "preparing",
        errorKey: FILE_ERROR_KEYS.networkFailure,
      }),
    ).toBe("prepare");
    expect(
      resolveRetryAction({
        ...base,
        failureStage: "uploading",
        errorKey: FILE_ERROR_KEYS.networkFailure,
      }),
    ).toBe("upload");
    expect(
      resolveRetryAction({
        ...base,
        upload: expired,
        failureStage: "uploading",
        errorKey: FILE_ERROR_KEYS.expiredUpload,
      }),
    ).toBe("prepare");
    expect(
      resolveRetryAction({
        ...base,
        failureStage: "finalizing",
        errorKey: FILE_ERROR_KEYS.networkFailure,
      }),
    ).toBe("finalize");
    expect(
      resolveRetryAction({
        ...base,
        failureStage: "finalizing",
        errorKey: FILE_ERROR_KEYS.objectNotUploaded,
      }),
    ).toBe("upload");
  });

  test("treats a presigned URL as expired before the raw timestamp", () => {
    const upload = toPreparedUpload(
      {
        url: "https://storage.example.test/upload",
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        expiresInSeconds: 4,
      },
      1_000,
    );

    expect(isPresignedUploadExpired(upload, 1_000)).toBe(true);
    expect(isPresignedUploadExpired(createUpload(10_000), 1_000)).toBe(false);
  });
});
