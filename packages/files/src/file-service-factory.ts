import { getDb } from "@repo/db";
import { getStorage } from "@repo/storage";
import { createFileRepository } from "./file-repository.js";
import { createFileService, type FileService } from "./file-service.js";

let fileService: FileService | undefined;

export function getFileService(): FileService {
  if (fileService === undefined) {
    fileService = createFileService({
      repository: createFileRepository(getDb()),
      storage: getStorage(),
    });
  }

  return fileService;
}
