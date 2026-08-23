import {
  completeUpload as completeUploadRequest,
  createUpload as createUploadRequest,
} from "../api/file-api";
import {
  FILE_ERROR_KEYS,
  isCancelError,
  mapUnknownUploadError,
} from "../api/file-errors";
import { putPresignedObject } from "../api/put-presigned-object";
import type { CreateUploadInput, PublicFile } from "../types/file";
import {
  createInitialUploadState,
  type FileUploadState,
  type UploadAction,
  type UploadProgress,
  type UploadRetryAction,
} from "../types/upload-state";
import {
  isPresignedUploadExpired,
  reduceUploadState,
  resolveRetryAction,
  stageFromStatus,
  toPreparedUpload,
} from "./upload-state";

export type FileUploadWorkflowDependencies = {
  createUpload?: (
    input: CreateUploadInput,
    options?: { signal?: AbortSignal },
  ) => Promise<{
    file: PublicFile;
    upload: {
      url: string;
      method: "PUT";
      headers: { "Content-Type": string };
      expiresInSeconds: number;
    };
  }>;
  completeUpload?: (
    fileId: string,
    options?: { signal?: AbortSignal },
  ) => Promise<PublicFile>;
  putObject?: typeof putPresignedObject;
  now?: () => number;
};

export function createFileUploadWorkflow(
  dependencies: FileUploadWorkflowDependencies = {},
) {
  const createUpload = dependencies.createUpload ?? createUploadRequest;
  const completeUpload = dependencies.completeUpload ?? completeUploadRequest;
  const putObject = dependencies.putObject ?? putPresignedObject;
  const now = dependencies.now ?? Date.now;

  let state = createInitialUploadState();
  let runId = 0;
  let abortController: AbortController | null = null;
  const listeners = new Set<(next: FileUploadState) => void>();

  function emit(next: FileUploadState) {
    state = next;
    for (const listener of listeners) {
      listener(state);
    }
  }

  function dispatch(action: UploadAction) {
    emit(reduceUploadState(state, action));
  }

  function subscribe(listener: (next: FileUploadState) => void) {
    listeners.add(listener);
    listener(state);
    return () => {
      listeners.delete(listener);
    };
  }

  function abortCurrent() {
    abortController?.abort();
    abortController = null;
  }

  async function run(action: UploadRetryAction) {
    const currentRun = ++runId;
    abortCurrent();
    abortController = new AbortController();
    const signal = abortController.signal;

    const selectedFile = state.selectedFile;
    const contentType = state.contentType;

    if (selectedFile === null || contentType === null) {
      return;
    }

    try {
      let nextAction = action;
      let preparedInThisRun = false;

      while (currentRun === runId) {
        if (nextAction === "prepare") {
          dispatch({ type: "preparing" });
          const result = await createUpload(
            {
              filename: selectedFile.name,
              contentType,
              size: selectedFile.size,
            },
            { signal },
          );

          if (currentRun !== runId) {
            return;
          }

          dispatch({
            type: "prepared",
            publicFile: result.file,
            upload: toPreparedUpload(result.upload, now()),
          });
          preparedInThisRun = true;
          nextAction = "upload";
          continue;
        }

        if (nextAction === "upload") {
          const upload = state.upload;

          if (upload === null || isPresignedUploadExpired(upload, now())) {
            if (preparedInThisRun) {
              dispatch({
                type: "failed",
                stage: "uploading",
                errorKey: FILE_ERROR_KEYS.expiredUpload,
              });
              return;
            }

            nextAction = "prepare";
            continue;
          }

          dispatch({ type: "uploading" });
          await putObject({
            url: upload.url,
            body: selectedFile,
            contentType: upload.headers["Content-Type"],
            signal,
            onProgress(progress: UploadProgress) {
              if (currentRun === runId) {
                dispatch({ type: "progress", progress });
              }
            },
          });

          if (currentRun !== runId) {
            return;
          }

          nextAction = "finalize";
          continue;
        }

        const fileId = state.publicFile?.id;

        if (fileId === undefined) {
          if (preparedInThisRun) {
            dispatch({
              type: "failed",
              stage: "finalizing",
              errorKey: FILE_ERROR_KEYS.unexpected,
            });
            return;
          }

          nextAction = "prepare";
          continue;
        }

        dispatch({ type: "finalizing" });
        const publicFile = await completeUpload(fileId, { signal });

        if (currentRun !== runId) {
          return;
        }

        dispatch({ type: "completed", publicFile });
        return;
      }
    } catch (error) {
      if (currentRun !== runId) {
        return;
      }

      if (isCancelError(error)) {
        return;
      }

      dispatch({
        type: "failed",
        stage: stageFromStatus(state.status),
        errorKey: mapUnknownUploadError(error),
      });
    }
  }

  return {
    getState() {
      return state;
    },
    subscribe,
    start(file: File, contentType: string) {
      abortCurrent();
      dispatch({ type: "file-accepted", file, contentType });
      void run("prepare");
    },
    failValidation(errorKey: NonNullable<FileUploadState["errorKey"]>) {
      abortCurrent();
      dispatch({
        type: "validation-failed",
        errorKey,
      });
    },
    openPicker() {
      dispatch({ type: "picker-opened" });
    },
    cancel() {
      if (
        state.status !== "preparing" &&
        state.status !== "uploading" &&
        state.status !== "finalizing"
      ) {
        return;
      }

      const stage = stageFromStatus(state.status);
      abortCurrent();
      runId += 1;
      dispatch({ type: "cancelled", stage });
    },
    retry() {
      const action = resolveRetryAction(state, now());

      if (action === null) {
        return;
      }

      void run(action);
    },
    reset() {
      abortCurrent();
      runId += 1;
      dispatch({ type: "reset" });
    },
  };
}

export type FileUploadWorkflow = ReturnType<typeof createFileUploadWorkflow>;
