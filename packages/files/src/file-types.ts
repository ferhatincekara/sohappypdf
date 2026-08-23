import type { FileStatus } from "./file-status.js";

export type FileRecord = {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  objectKey: string;
  status: FileStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  deletedAt: Date | null;
};

export type CreateFileInput = {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  expiresInMs?: number;
};

export type CreateFileResult = {
  file: FileRecord;
  upload: {
    key: string;
    expiresInSeconds: number;
    url: string;
  };
};
