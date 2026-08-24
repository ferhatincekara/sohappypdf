import { createFileUploadWorkflow } from "@/features/files/lib/upload-workflow";
import type { PublicFile } from "@/features/files/types/file";
import { createPublicToolApis } from "../api/public-tool-api";

export async function uploadTemporaryAsset(input: {
  file: File;
  contentType: string;
  authenticated: boolean;
}): Promise<PublicFile> {
  const apis = createPublicToolApis(input.authenticated);

  return new Promise((resolve, reject) => {
    const workflow = createFileUploadWorkflow({
      createUpload: apis.createUpload,
      completeUpload: apis.completeUpload,
    });

    const unsubscribe = workflow.subscribe((state) => {
      if (state.status === "completed" && state.publicFile !== null) {
        unsubscribe();
        resolve(state.publicFile);
        return;
      }

      if (state.status === "failed") {
        unsubscribe();
        reject(new Error(state.errorKey ?? "networkFailure"));
      }
    });

    workflow.start(input.file, input.contentType);
  });
}
