import { loadFileConfig, loadRetentionPolicy } from "@repo/config";
import { getDb } from "@repo/db";
import { getStorage } from "@repo/storage";
import { createFileRepository } from "./file-repository.js";
import { createFileService, type FileService } from "./file-service.js";

let fileService: FileService | undefined;

export function getFileService(): FileService {
  if (fileService === undefined) {
    const fileConfig = loadFileConfig();
    const retention = loadRetentionPolicy();
    fileService = createFileService({
      repository: createFileRepository(getDb()),
      storage: getStorage(),
      maxFileSizeBytes: fileConfig.maxUploadFileSizeBytes,
      fileTtlMs: retention.authenticatedMs,
    });
  }

  return fileService;
}
