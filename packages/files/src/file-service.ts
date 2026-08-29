import { randomUUID } from "node:crypto";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import {
  assertValidObjectKey,
  createFileOriginalKey,
  type Storage,
} from "@sohappypdf/storage";
import { buildZipArchive } from "@sohappypdf/utils/zip";
import {
  DEFAULT_FILE_TTL_MS,
  getFileExpirationDate,
  isEligibleForCleanup,
  isFileExpired,
  remainingFileTtlMs,
  throwIfOwnedFileExpired,
} from "./file-expiration.js";
import {
  assertFileListLimit,
  decodeFileListCursor,
  encodeFileListCursor,
} from "./file-pagination.js";
import type { FileRepository } from "./file-repository.js";
import { assertFileStatusTransition, type FileStatus } from "./file-status.js";
import type {
  CreateFileInput,
  CreateFileResult,
  FileListQuery,
  FileListResult,
  FileRecord,
  RegisterStoredFileInput,
} from "./file-types.js";
import {
  assertFileId,
  assertFileOwnerId,
  assertFileSizeBytes,
  assertMimeType,
  assertOriginalFilename,
  MAX_FILE_SIZE_BYTES,
} from "./file-validation.js";
import {
  DEFAULT_RESOURCE_OWNER_KIND,
  type ResourceOwnerTransferInput,
  type ResourceOwnerTransferResult,
} from "./resource-owner.js";

const DEFAULT_CLEANUP_LIMIT = 100;
const MAX_CLEANUP_LIMIT = 100;
export const MIN_ARCHIVE_FILES = 2;
export const MAX_ARCHIVE_FILES = 20;
const DEFAULT_ARCHIVE_NAME = "sohappypdf-export.zip";

export type ArchiveFileInput = {
  id: string;
  name?: string;
};

export type CreateOwnedArchiveInput = {
  ownerId: string;
  files: readonly ArchiveFileInput[];
  archiveName?: string;
};

function assertArchiveFilename(value: string | undefined): string {
  const filename = assertOriginalFilename(value ?? DEFAULT_ARCHIVE_NAME);
  return filename.toLowerCase().endsWith(".zip") ? filename : `${filename}.zip`;
}

function invalidArchiveFiles(): AppError {
  return new AppError({
    code: APP_ERROR_CODES.VALIDATION_ERROR,
    message: "Invalid archive files",
  });
}

export type FileServiceOptions = {
  repository: FileRepository;
  storage: Storage;
  now?: () => Date;
  fileTtlMs?: number;
  maxFileSizeBytes?: number;
};

export type FileCleanupSummary = {
  scanned: number;
  deleted: number;
  failed: number;
  failureFileIds: string[];
};

export type FileDownloadUrl = {
  fileId: string;
  expiresInSeconds: number;
  url: string;
};

export type FileService = {
  createUploadIntent(input: CreateFileInput): Promise<CreateFileResult>;
  createFile(input: CreateFileInput): Promise<CreateFileResult>;
  completeUpload(id: string, ownerId: string): Promise<FileRecord>;
  registerStoredFile(input: RegisterStoredFileInput): Promise<FileRecord>;
  findFileById(id: string): Promise<FileRecord | undefined>;
  getOwnedFile(id: string, ownerId: string): Promise<FileRecord>;
  createOwnedDownloadUrl(id: string, ownerId: string): Promise<FileDownloadUrl>;
  createOwnedArchiveDownloadUrl(
    input: CreateOwnedArchiveInput,
  ): Promise<FileDownloadUrl>;
  listOwnedFiles(query: FileListQuery): Promise<FileListResult>;
  markFileUploaded(id: string): Promise<FileRecord>;
  updateFileStatus(id: string, status: FileStatus): Promise<FileRecord>;
  deleteOwnedFile(id: string, ownerId: string): Promise<FileRecord>;
  deleteFile(id: string): Promise<FileRecord>;
  listFilesEligibleForCleanup(limit?: number): Promise<FileRecord[]>;
  cleanupExpiredFiles(limit?: number): Promise<FileCleanupSummary>;
  listPurgedFiles(limit?: number): Promise<FileRecord[]>;
  hardDeleteFile(id: string): Promise<void>;
  sumActiveStorageBytes(ownerId: string): Promise<number>;
  transferOwner(
    input: Omit<ResourceOwnerTransferInput, "now"> & { now?: Date },
  ): Promise<ResourceOwnerTransferResult>;
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

function normalizeMimeType(value: string): string {
  const [mediaType] = value.split(";");
  return mediaType?.trim().toLowerCase() ?? "";
}

function isOwnedBy(file: FileRecord, ownerId: string): boolean {
  return file.ownerId === ownerId;
}

function isUnavailable(file: FileRecord, now: Date): boolean {
  return (
    file.status === "deleted" ||
    file.deletedAt !== null ||
    file.purgedAt !== null ||
    isFileExpired(file, now)
  );
}

function requireOwnedAccessibleFile(
  file: FileRecord | undefined,
  ownerId: string,
  now: Date,
): FileRecord {
  const found = requireFile(file);

  if (!isOwnedBy(found, ownerId)) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "File not found",
    });
  }

  throwIfOwnedFileExpired(found, now);

  if (isUnavailable(found, now)) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "File not found",
    });
  }

  return found;
}

export function createFileService(options: FileServiceOptions): FileService {
  const now = options.now ?? (() => new Date());
  const fileTtlMs = options.fileTtlMs ?? DEFAULT_FILE_TTL_MS;
  const maxFileSizeBytes = options.maxFileSizeBytes ?? MAX_FILE_SIZE_BYTES;

  async function createUploadIntent(
    input: CreateFileInput,
  ): Promise<CreateFileResult> {
    const originalFilename = assertOriginalFilename(input.originalFilename);
    const mimeType = assertMimeType(input.mimeType);
    const sizeBytes = assertFileSizeBytes(input.sizeBytes, maxFileSizeBytes);
    const ownerId = assertFileOwnerId(input.ownerId);
    const createdAt = now();
    const id = randomUUID();
    const file: FileRecord = {
      id,
      ownerId,
      ownerKind: input.ownerKind ?? DEFAULT_RESOURCE_OWNER_KIND,
      originalFilename,
      mimeType,
      sizeBytes,
      objectKey: createFileOriginalKey(id),
      status: "pending",
      createdAt,
      updatedAt: createdAt,
      expiresAt: getFileExpirationDate({
        createdAt,
        retentionMs: input.expiresInMs ?? fileTtlMs,
      }),
      deletedAt: null,
      purgedAt: null,
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
  }

  async function verifyUploadedObject(file: FileRecord): Promise<boolean> {
    const metadata = await options.storage.getObjectMetadata(file.objectKey);

    if (metadata === undefined) {
      return false;
    }

    if (metadata.contentLength !== file.sizeBytes) {
      return false;
    }

    if (
      metadata.contentType !== undefined &&
      normalizeMimeType(metadata.contentType) !==
        normalizeMimeType(file.mimeType)
    ) {
      return false;
    }

    return true;
  }

  async function markFileUploaded(id: string): Promise<FileRecord> {
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

    const verified = await verifyUploadedObject(file);

    if (!verified) {
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
  }

  async function deleteFile(id: string): Promise<FileRecord> {
    const file = requireFile(
      await options.repository.findById(assertFileId(id)),
    );

    if (file.status === "deleted") {
      return file;
    }

    const deleted = requireFile(
      await options.repository.markDeleted({
        id: file.id,
        now: now(),
      }),
    );

    await options.storage.deleteObject(file.objectKey);
    return deleted;
  }

  async function registerStoredFile(
    input: RegisterStoredFileInput,
  ): Promise<FileRecord> {
    const id = input.id === undefined ? randomUUID() : assertFileId(input.id);
    const existing = await options.repository.findById(id);

    if (existing !== undefined) {
      return existing;
    }

    const originalFilename = assertOriginalFilename(input.originalFilename);
    const mimeType = assertMimeType(input.mimeType);
    const sizeBytes = assertFileSizeBytes(input.sizeBytes, maxFileSizeBytes);
    const objectKey = assertValidObjectKey(input.objectKey);
    const ownerId = assertFileOwnerId(input.ownerId);
    const createdAt = now();
    const exists = await options.storage.objectExists(objectKey);

    if (!exists) {
      throw new AppError({
        code: APP_ERROR_CODES.CONFLICT,
        message: "File object was not uploaded",
      });
    }

    return options.repository.insert({
      id,
      ownerId,
      ownerKind: input.ownerKind ?? DEFAULT_RESOURCE_OWNER_KIND,
      originalFilename,
      mimeType,
      sizeBytes,
      objectKey,
      status: "uploaded",
      createdAt,
      updatedAt: createdAt,
      expiresAt: getFileExpirationDate({
        createdAt,
        retentionMs: input.expiresInMs ?? fileTtlMs,
      }),
      deletedAt: null,
      purgedAt: null,
    });
  }

  return {
    createUploadIntent,
    createFile: createUploadIntent,

    async completeUpload(id, ownerId) {
      const file = requireOwnedAccessibleFile(
        await options.repository.findById(assertFileId(id)),
        assertFileOwnerId(ownerId),
        now(),
      );

      return markFileUploaded(file.id);
    },

    registerStoredFile,

    async findFileById(id) {
      return options.repository.findById(assertFileId(id));
    },

    async getOwnedFile(id, ownerId) {
      return requireOwnedAccessibleFile(
        await options.repository.findById(assertFileId(id)),
        assertFileOwnerId(ownerId),
        now(),
      );
    },

    async createOwnedDownloadUrl(id, ownerId) {
      const file = requireOwnedAccessibleFile(
        await options.repository.findById(assertFileId(id)),
        assertFileOwnerId(ownerId),
        now(),
      );

      if (file.status === "pending" || file.status === "failed") {
        throw new AppError({
          code: APP_ERROR_CODES.CONFLICT,
          message: "File object was not uploaded",
        });
      }

      const download = await options.storage.createPresignedDownloadUrl({
        key: file.objectKey,
        filename: file.originalFilename,
      });

      return {
        fileId: file.id,
        expiresInSeconds: download.expiresInSeconds,
        url: download.url,
      };
    },

    async createOwnedArchiveDownloadUrl(input) {
      const ownerId = assertFileOwnerId(input.ownerId);

      if (
        input.files.length < MIN_ARCHIVE_FILES ||
        input.files.length > MAX_ARCHIVE_FILES
      ) {
        throw invalidArchiveFiles();
      }

      const seen = new Set<string>();
      const sources: FileRecord[] = [];
      const names: string[] = [];

      for (const entry of input.files) {
        const id = assertFileId(entry.id);

        if (seen.has(id)) {
          throw invalidArchiveFiles();
        }

        seen.add(id);

        const file = requireOwnedAccessibleFile(
          await options.repository.findById(id),
          ownerId,
          now(),
        );

        if (file.status === "pending" || file.status === "failed") {
          throw new AppError({
            code: APP_ERROR_CODES.CONFLICT,
            message: "File object was not uploaded",
          });
        }

        sources.push(file);
        names.push(assertOriginalFilename(entry.name ?? file.originalFilename));
      }

      const objects = await Promise.all(
        sources.map((file) => options.storage.getObject(file.objectKey)),
      );
      const zip = buildZipArchive(
        objects.map((object, index) => ({
          name: names[index] ?? "file.bin",
          data: object.body,
        })),
      );
      const archiveId = randomUUID();
      const objectKey = createFileOriginalKey(archiveId);

      await options.storage.uploadObject({
        key: objectKey,
        body: zip,
        contentType: "application/zip",
      });

      const first = sources[0];

      if (first === undefined) {
        throw invalidArchiveFiles();
      }

      const archived = await registerStoredFile({
        id: archiveId,
        ownerId,
        ownerKind: first.ownerKind ?? DEFAULT_RESOURCE_OWNER_KIND,
        originalFilename: assertArchiveFilename(input.archiveName),
        mimeType: "application/zip",
        sizeBytes: zip.byteLength,
        objectKey,
        expiresInMs: Math.min(
          ...sources.map((file) => remainingFileTtlMs(file, now())),
        ),
      });
      const download = await options.storage.createPresignedDownloadUrl({
        key: archived.objectKey,
        filename: archived.originalFilename,
      });

      return {
        fileId: archived.id,
        expiresInSeconds: download.expiresInSeconds,
        url: download.url,
      };
    },

    async listOwnedFiles(query) {
      const ownerId = assertFileOwnerId(query.ownerId);
      const limit = assertFileListLimit(query.limit);
      const cursor =
        query.cursor === undefined
          ? undefined
          : decodeFileListCursor(query.cursor);
      const records = await options.repository.listByOwner({
        ownerId,
        now: now(),
        limit: limit + 1,
        cursor,
      });
      const hasMore = records.length > limit;
      const page = hasMore ? records.slice(0, limit) : records;
      const last = page[page.length - 1];

      return {
        files: page,
        nextCursor:
          hasMore && last !== undefined ? encodeFileListCursor(last) : null,
      };
    },

    markFileUploaded,

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

    async deleteOwnedFile(id, ownerId) {
      const file = requireFile(
        await options.repository.findById(assertFileId(id)),
      );

      if (!isOwnedBy(file, assertFileOwnerId(ownerId))) {
        throw new AppError({
          code: APP_ERROR_CODES.NOT_FOUND,
          message: "File not found",
        });
      }

      return deleteFile(file.id);
    },

    deleteFile,

    async sumActiveStorageBytes(ownerId) {
      return options.repository.sumActiveStorageBytes(
        assertFileOwnerId(ownerId),
        now(),
      );
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

    async cleanupExpiredFiles(limit = DEFAULT_CLEANUP_LIMIT) {
      if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CLEANUP_LIMIT) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid cleanup limit",
        });
      }

      const files = await options.repository.listEligibleForCleanup({
        now: now(),
        limit,
      });
      const summary: FileCleanupSummary = {
        scanned: files.length,
        deleted: 0,
        failed: 0,
        failureFileIds: [],
      };

      for (const file of files) {
        try {
          const current = await options.repository.findById(file.id);

          if (current === undefined) {
            summary.deleted += 1;
            continue;
          }

          if (!isEligibleForCleanup(current, now())) {
            continue;
          }

          // Storage first: never purge the DB marker if delete fails.
          await options.storage.deleteObject(current.objectKey);

          const purged = await options.repository.markPurged({
            id: current.id,
            now: now(),
          });

          if (purged === undefined) {
            // Another cleanup worker already purged this row.
            summary.deleted += 1;
            continue;
          }

          summary.deleted += 1;
        } catch {
          summary.failed += 1;
          summary.failureFileIds.push(file.id);
        }
      }

      return summary;
    },

    async listPurgedFiles(limit = DEFAULT_CLEANUP_LIMIT) {
      if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CLEANUP_LIMIT) {
        throw new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid cleanup limit",
        });
      }

      return options.repository.listPurged({ limit });
    },

    async hardDeleteFile(id) {
      await options.repository.deleteById(assertFileId(id));
    },

    async transferOwner(input) {
      return options.repository.transferOwner({
        fromOwnerId: assertFileOwnerId(input.fromOwnerId),
        fromOwnerKind: input.fromOwnerKind,
        toOwnerId: assertFileOwnerId(input.toOwnerId),
        toOwnerKind: input.toOwnerKind,
        now: input.now ?? now(),
      });
    },
  };
}
