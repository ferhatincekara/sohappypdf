import { loadFileConfig, loadRetentionPolicy } from "@sohappypdf/config";
import { getDb } from "@sohappypdf/db";
import { getStorage } from "@sohappypdf/storage";
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
