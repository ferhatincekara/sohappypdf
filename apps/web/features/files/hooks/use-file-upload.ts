"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { filesQueryKeys } from "../api/file-query-keys";
import { isUploadInFlight, resolveRetryAction } from "../lib/upload-state";
import {
  createFileUploadWorkflow,
  type FileUploadWorkflow,
} from "../lib/upload-workflow";
import { validateSelectedFiles } from "../lib/validate-upload-file";
import {
  createInitialUploadState,
  type FileUploadState,
} from "../types/upload-state";

export function useFileUpload(maxUploadFileSizeBytes?: number) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<FileUploadState>(createInitialUploadState);
  const workflowRef = useRef<FileUploadWorkflow | null>(null);

  if (workflowRef.current === null) {
    workflowRef.current = createFileUploadWorkflow();
  }

  useEffect(() => {
    const workflow = workflowRef.current;

    if (workflow === null) {
      return;
    }

    return workflow.subscribe((next) => {
      setState(next);

      if (next.status === "completed") {
        void queryClient.invalidateQueries({
          queryKey: filesQueryKeys.lists(),
        });
      }
    });
  }, [queryClient]);

  function selectFiles(files: FileList | File[] | null | undefined) {
    const result = validateSelectedFiles(files, maxUploadFileSizeBytes);

    if (!result.ok) {
      workflowRef.current?.failValidation(result.errorKey);
      return;
    }

    if (result.file === undefined) {
      workflowRef.current?.failValidation("missingFile");
      return;
    }

    workflowRef.current?.start(result.file, result.contentType);
  }

  return {
    state,
    isBusy: isUploadInFlight(state.status),
    canRetry: resolveRetryAction(state) !== null,
    canCancel: isUploadInFlight(state.status),
    selectFiles,
    openPicker() {
      workflowRef.current?.openPicker();
    },
    cancel() {
      workflowRef.current?.cancel();
    },
    retry() {
      if (state.status === "failed" && state.failureStage === "validation") {
        return;
      }

      workflowRef.current?.retry();
    },
    reset() {
      workflowRef.current?.reset();
    },
  };
}
