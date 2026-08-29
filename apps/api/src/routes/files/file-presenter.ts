import type { CreateFileResult, FileRecord } from "@sohappypdf/files";

export type PublicFile = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  status: FileRecord["status"];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export function toPublicFile(file: FileRecord): PublicFile {
  return {
    id: file.id,
    filename: file.originalFilename,
    contentType: file.mimeType,
    size: file.sizeBytes,
    status: file.status,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    expiresAt: file.expiresAt.toISOString(),
  };
}

export function toUploadIntentResponse(result: CreateFileResult) {
  return {
    file: toPublicFile(result.file),
    upload: {
      url: result.upload.url,
      method: "PUT" as const,
      headers: {
        "Content-Type": result.file.mimeType,
      },
      expiresInSeconds: result.upload.expiresInSeconds,
    },
  };
}
