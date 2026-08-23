import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type Database, files } from "@repo/db";
import { and, desc, eq, gt, isNull, lt, lte, ne, or } from "drizzle-orm";
import type { FileListCursor } from "./file-pagination.js";
import type { FileStatus } from "./file-status.js";
import type { FileRecord } from "./file-types.js";

export type ApiFileListInput = {
  ownerId: string;
  now: Date;
  limit: number;
  cursor?: FileListCursor;
};

export type FileRepository = {
  insert(file: FileRecord): Promise<FileRecord>;
  findById(id: string): Promise<FileRecord | undefined>;
  listByOwner(input: ApiFileListInput): Promise<FileRecord[]>;
  updateStatus(input: {
    id: string;
    from: FileStatus;
    to: FileStatus;
    now: Date;
  }): Promise<FileRecord | undefined>;
  markDeleted(input: {
    id: string;
    now: Date;
  }): Promise<FileRecord | undefined>;
  deleteById(id: string): Promise<void>;
  listEligibleForCleanup(input: {
    now: Date;
    limit: number;
  }): Promise<FileRecord[]>;
};

function toFileRecord(row: typeof files.$inferSelect): FileRecord {
  return {
    id: row.id,
    ownerId: row.ownerId,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    objectKey: row.objectKey,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
    deletedAt: row.deletedAt,
  };
}

export function createFileRepository(db: Database): FileRepository {
  return {
    async insert(file) {
      const [row] = await db
        .insert(files)
        .values({
          id: file.id,
          ownerId: file.ownerId,
          originalFilename: file.originalFilename,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          objectKey: file.objectKey,
          status: file.status,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          expiresAt: file.expiresAt,
          deletedAt: file.deletedAt,
        })
        .returning();

      if (row === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Failed to create file",
        });
      }

      return toFileRecord(row);
    },

    async findById(id) {
      const [row] = await db
        .select()
        .from(files)
        .where(eq(files.id, id))
        .limit(1);

      if (row === undefined) {
        return undefined;
      }

      return toFileRecord(row);
    },

    async listByOwner(input) {
      const conditions = [
        eq(files.ownerId, input.ownerId),
        isNull(files.deletedAt),
        ne(files.status, "deleted"),
        gt(files.expiresAt, input.now),
      ];

      if (input.cursor !== undefined) {
        const cursorFilter = or(
          lt(files.createdAt, input.cursor.createdAt),
          and(
            eq(files.createdAt, input.cursor.createdAt),
            lt(files.id, input.cursor.id),
          ),
        );

        if (cursorFilter !== undefined) {
          conditions.push(cursorFilter);
        }
      }

      const rows = await db
        .select()
        .from(files)
        .where(and(...conditions))
        .orderBy(desc(files.createdAt), desc(files.id))
        .limit(input.limit);

      return rows.map((row) => toFileRecord(row));
    },

    async updateStatus(input) {
      const [row] = await db
        .update(files)
        .set({
          status: input.to,
          updatedAt: input.now,
        })
        .where(and(eq(files.id, input.id), eq(files.status, input.from)))
        .returning();

      if (row === undefined) {
        return undefined;
      }

      return toFileRecord(row);
    },

    async markDeleted(input) {
      const [row] = await db
        .update(files)
        .set({
          status: "deleted",
          deletedAt: input.now,
          updatedAt: input.now,
        })
        .where(eq(files.id, input.id))
        .returning();

      if (row === undefined) {
        return undefined;
      }

      return toFileRecord(row);
    },

    async deleteById(id) {
      await db.delete(files).where(eq(files.id, id));
    },

    async listEligibleForCleanup(input) {
      const rows = await db
        .select()
        .from(files)
        .where(
          and(ne(files.status, "deleted"), lte(files.expiresAt, input.now)),
        )
        .limit(input.limit);

      return rows.map((row) => toFileRecord(row));
    },
  };
}
