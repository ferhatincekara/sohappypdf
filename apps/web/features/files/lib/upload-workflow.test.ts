import { describe, expect, test } from "bun:test";
import { FileApiRequestError } from "../api/file-api";
import { FILE_ERROR_KEYS, StorageUploadError } from "../api/file-errors";
import type { CreateUploadResponse, PublicFile } from "../types/file";
import { createFileUploadWorkflow } from "./upload-workflow";

function createBrowserFile(): File {
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

function createIntent(): CreateUploadResponse {
  return {
    file: createPublicFile(),
    upload: {
      url: "https://storage.example.test/upload",
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      expiresInSeconds: 60,
    },
  };
}

async function waitForStatus(
  workflow: ReturnType<typeof createFileUploadWorkflow>,
  status: string,
) {
  if (workflow.getState().status === status) {
    return workflow.getState();
  }

  return await new Promise<ReturnType<typeof workflow.getState>>(
    (resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timed out waiting for ${status}`));
      }, 1_000);
      const unsubscribe = workflow.subscribe((state) => {
        if (state.status === status) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(state);
        }
      });
    },
  );
}

describe("upload workflow", () => {
  test("creates an intent, uploads to the presigned URL, then finalizes", async () => {
    const calls: string[] = [];
    const workflow = createFileUploadWorkflow({
      async createUpload(input) {
        calls.push("create");
        expect(input).toEqual({
          filename: "report.pdf",
          contentType: "application/pdf",
          size: 8,
        });
        return createIntent();
      },
      async putObject(options) {
        calls.push("put");
        expect(options.url).toBe("https://storage.example.test/upload");
        expect(options.contentType).toBe("application/pdf");
        options.onProgress?.({ loaded: 8, total: 8, percent: 100 });
      },
      async completeUpload(fileId) {
        calls.push("complete");
        expect(fileId).toBe("11111111-1111-4111-8111-111111111111");
        return createPublicFile("uploaded");
      },
    });

    workflow.start(createBrowserFile(), "application/pdf");
    const completed = await waitForStatus(workflow, "completed");

    expect(calls).toEqual(["create", "put", "complete"]);
    expect(completed.publicFile?.status).toBe("uploaded");
    expect(completed.upload).toBeNull();
  });

  test("stops after a storage upload failure", async () => {
    const workflow = createFileUploadWorkflow({
      async createUpload() {
        return createIntent();
      },
      async putObject() {
        throw new StorageUploadError("network");
      },
      async completeUpload() {
        throw new Error("complete should not run");
      },
    });

    workflow.start(createBrowserFile(), "application/pdf");
    const failed = await waitForStatus(workflow, "failed");

    expect(failed.failureStage).toBe("uploading");
    expect(failed.errorKey).toBe(FILE_ERROR_KEYS.networkFailure);
  });

  test("retries only finalization after a complete failure", async () => {
    const calls: string[] = [];
    let shouldFailComplete = true;
    const workflow = createFileUploadWorkflow({
      async createUpload() {
        calls.push("create");
        return createIntent();
      },
      async putObject() {
        calls.push("put");
      },
      async completeUpload() {
        calls.push("complete");
        if (shouldFailComplete) {
          shouldFailComplete = false;
          throw new FileApiRequestError(new Error("network"));
        }

        return createPublicFile("uploaded");
      },
    });

    workflow.start(createBrowserFile(), "application/pdf");
    await waitForStatus(workflow, "failed");
    workflow.retry();
    const completed = await waitForStatus(workflow, "completed");

    expect(calls).toEqual(["create", "put", "complete", "complete"]);
    expect(completed.status).toBe("completed");
  });

  test("requests a new presigned URL when the previous one expired", async () => {
    const createCount = { value: 0 };
    const workflow = createFileUploadWorkflow({
      now: () => 10_000,
      async createUpload() {
        createCount.value += 1;
        return {
          ...createIntent(),
          upload: {
            ...createIntent().upload,
            expiresInSeconds: createCount.value === 1 ? 1 : 60,
          },
        };
      },
      async putObject() {},
      async completeUpload() {
        return createPublicFile("uploaded");
      },
    });

    workflow.start(createBrowserFile(), "application/pdf");
    await waitForStatus(workflow, "failed");
    expect(workflow.getState().errorKey).toBe(FILE_ERROR_KEYS.expiredUpload);

    workflow.retry();
    await waitForStatus(workflow, "completed");
    expect(createCount.value).toBe(2);
  });
});
