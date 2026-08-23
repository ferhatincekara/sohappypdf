import type { FileStatus } from "./file-status.js";

export type FileRecord = {
  id: string;
  ownerId: string;
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
  ownerId: string;
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

export type RegisterStoredFileInput = {
  id?: string;
  ownerId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  objectKey: string;
  expiresInMs?: number;
};

export type FileListQuery = {
  ownerId: string;
  limit?: number;
  cursor?: string;
};

export type FileListResult = {
  files: FileRecord[];
  nextCursor: string | null;
};
