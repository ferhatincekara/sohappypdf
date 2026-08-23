import { randomUUID } from "node:crypto";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import {
  assertValidObjectKey,
  createFileOriginalKey,
  type Storage,
} from "@repo/storage";
import { DEFAULT_FILE_TTL_MS } from "./file-expiration.js";
import type { FileRepository } from "./file-repository.js";
import { assertFileStatusTransition, type FileStatus } from "./file-status.js";
import type {
  CreateFileInput,
  CreateFileResult,
  FileRecord,
  RegisterStoredFileInput,
} from "./file-types.js";
import {
  assertFileId,
  assertFileSizeBytes,
  assertMimeType,
  assertOriginalFilename,
} from "./file-validation.js";

const DEFAULT_CLEANUP_LIMIT = 100;
const MAX_CLEANUP_LIMIT = 100;

export type FileServiceOptions = {
  repository: FileRepository;
  storage: Storage;
  now?: () => Date;
  fileTtlMs?: number;
};

export type FileService = {
  createFile(input: CreateFileInput): Promise<CreateFileResult>;
  registerStoredFile(input: RegisterStoredFileInput): Promise<FileRecord>;
  findFileById(id: string): Promise<FileRecord | undefined>;
  markFileUploaded(id: string): Promise<FileRecord>;
  updateFileStatus(id: string, status: FileStatus): Promise<FileRecord>;
  deleteFile(id: string): Promise<FileRecord>;
  listFilesEligibleForCleanup(limit?: number): Promise<FileRecord[]>;
};

function requireFile(file: FileRecord | undefined): FileRecord {
  if (file === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "File not found",
    });
  }

  return file;
}

export function createFileService(options: FileServiceOptions): FileService {
  const now = options.now ?? (() => new Date());
  const fileTtlMs = options.fileTtlMs ?? DEFAULT_FILE_TTL_MS;

  return {
    async createFile(input) {
      const originalFilename = assertOriginalFilename(input.originalFilename);
      const mimeType = assertMimeType(input.mimeType);
      const sizeBytes = assertFileSizeBytes(input.sizeBytes);
      const createdAt = now();
      const expiresInMs = input.expiresInMs ?? fileTtlMs;

      if (!Number.isInteger(expiresInMs) || expiresInMs < 1) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid file expiration",
        });
      }

      const id = randomUUID();
      const file: FileRecord = {
        id,
        originalFilename,
        mimeType,
        sizeBytes,
        objectKey: createFileOriginalKey(id),
        status: "pending",
        createdAt,
        updatedAt: createdAt,
        expiresAt: new Date(createdAt.getTime() + expiresInMs),
        deletedAt: null,
      };

      const created = await options.repository.insert(file);

      try {
        const upload = await options.storage.createPresignedUploadUrl({
          key: created.objectKey,
          contentType: created.mimeType,
        });

        return {
          file: created,
          upload: {
            key: upload.key,
            expiresInSeconds: upload.expiresInSeconds,
            url: upload.url,
          },
        };
      } catch (error) {
        await options.repository.deleteById(created.id);
        throw error;
      }
    },

    async registerStoredFile(input) {
      const id = input.id === undefined ? randomUUID() : assertFileId(input.id);
      const existing = await options.repository.findById(id);

      if (existing !== undefined) {
        return existing;
      }

      const originalFilename = assertOriginalFilename(input.originalFilename);
      const mimeType = assertMimeType(input.mimeType);
      const sizeBytes = assertFileSizeBytes(input.sizeBytes);
      const objectKey = assertValidObjectKey(input.objectKey);
      const createdAt = now();
      const expiresInMs = input.expiresInMs ?? fileTtlMs;

      if (!Number.isInteger(expiresInMs) || expiresInMs < 1) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid file expiration",
        });
      }

      const exists = await options.storage.objectExists(objectKey);

      if (!exists) {
        throw new AppError({
          code: APP_ERROR_CODES.CONFLICT,
          message: "File object was not uploaded",
        });
      }

      return options.repository.insert({
        id,
        originalFilename,
        mimeType,
        sizeBytes,
        objectKey,
        status: "uploaded",
        createdAt,
        updatedAt: createdAt,
        expiresAt: new Date(createdAt.getTime() + expiresInMs),
        deletedAt: null,
      });
    },

    async findFileById(id) {
      return options.repository.findById(assertFileId(id));
    },

    async markFileUploaded(id) {
      const file = requireFile(
        await options.repository.findById(assertFileId(id)),
      );

      if (
        file.status === "uploaded" ||
        file.status === "processing" ||
        file.status === "completed"
      ) {
        return file;
      }

      assertFileStatusTransition(file.status, "uploaded");

      const exists = await options.storage.objectExists(file.objectKey);

      if (!exists) {
        const failed = await options.repository.updateStatus({
          id: file.id,
          from: file.status,
          to: "failed",
          now: now(),
        });

        throw new AppError({
          code: APP_ERROR_CODES.CONFLICT,
          message: "File object was not uploaded",
          cause: failed,
        });
      }

      const updated = await options.repository.updateStatus({
        id: file.id,
        from: file.status,
        to: "uploaded",
        now: now(),
      });

      return requireFile(updated);
    },

    async updateFileStatus(id, status) {
      const file = requireFile(
        await options.repository.findById(assertFileId(id)),
      );

      if (file.status === status) {
        return file;
      }

      assertFileStatusTransition(file.status, status);

      const updated = await options.repository.updateStatus({
        id: file.id,
        from: file.status,
        to: status,
        now: now(),
      });

      return requireFile(updated);
    },

    async deleteFile(id) {
      const file = requireFile(
        await options.repository.findById(assertFileId(id)),
      );

      await options.storage.deleteObject(file.objectKey);

      const deleted = await options.repository.markDeleted({
        id: file.id,
        now: now(),
      });

      return requireFile(deleted);
    },

    async listFilesEligibleForCleanup(limit = DEFAULT_CLEANUP_LIMIT) {
      if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CLEANUP_LIMIT) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid cleanup limit",
        });
      }

      return options.repository.listEligibleForCleanup({
        now: now(),
        limit,
      });
    },
  };
}
