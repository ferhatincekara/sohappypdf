import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import type { FileRecord } from "@repo/files";
import type { ConversionRepository } from "./conversion-repository.js";
import { createConversionService } from "./conversion-service.js";
import type { ConversionRecord } from "./conversion-types.js";

function createFile(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    ownerId: "user_1",
    originalFilename: "report.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
    objectKey: "files/550e8400-e29b-41d4-a716-446655440000/original",
    status: "uploaded",
    createdAt: new Date("2026-08-23T18:00:00.000Z"),
    updatedAt: new Date("2026-08-23T18:00:00.000Z"),
    expiresAt: new Date("2026-12-31T00:00:00.000Z"),
    deletedAt: null,
    purgedAt: null,
    ...overrides,
  };
}

function createMemoryRepository(
  seed: ConversionRecord[] = [],
): ConversionRepository {
  const records = new Map<string, ConversionRecord>(
    seed.map((conversion) => [conversion.id, { ...conversion }]),
  );

  return {
    async insert(conversion) {
      records.set(conversion.id, { ...conversion });
      return { ...conversion };
    },
    async findById(id) {
      const conversion = records.get(id);
      return conversion === undefined ? undefined : { ...conversion };
    },
    async findByIdempotencyKey(ownerId, key) {
      const conversion = [...records.values()].find(
        (item) => item.ownerId === ownerId && item.idempotencyKey === key,
      );
      return conversion === undefined ? undefined : { ...conversion };
    },
    async listByOwner(input) {
      return [...records.values()]
        .filter((conversion) => {
          if (conversion.ownerId !== input.ownerId) {
            return false;
          }

          if (
            input.now !== undefined &&
            conversion.expiresAt !== null &&
            conversion.expiresAt.getTime() <= input.now.getTime()
          ) {
            return false;
          }

          if (
            input.status !== undefined &&
            conversion.status !== input.status
          ) {
            return false;
          }

          if (
            input.targetFormat !== undefined &&
            conversion.targetFormat !== input.targetFormat
          ) {
            return false;
          }

          if (input.cursor === undefined) {
            return true;
          }

          if (
            conversion.createdAt.getTime() < input.cursor.createdAt.getTime()
          ) {
            return true;
          }

          return (
            conversion.createdAt.getTime() ===
              input.cursor.createdAt.getTime() &&
            conversion.id < input.cursor.id
          );
        })
        .sort((left, right) => {
          const created = right.createdAt.getTime() - left.createdAt.getTime();
          return created === 0 ? right.id.localeCompare(left.id) : created;
        })
        .slice(0, input.limit)
        .map((conversion) => ({ ...conversion }));
    },
    async updateStatus(input) {
      const conversion = records.get(input.id);

      if (conversion === undefined || conversion.status !== input.from) {
        return undefined;
      }

      const updated: ConversionRecord = {
        ...conversion,
        status: input.to,
        updatedAt: input.now,
        queuedAt: input.to === "queued" ? input.now : conversion.queuedAt,
        startedAt: input.to === "processing" ? input.now : conversion.startedAt,
        completedAt:
          input.to === "completed" ||
          input.to === "failed" ||
          input.to === "cancelled"
            ? input.now
            : conversion.completedAt,
        outputFileId:
          input.outputFileId === undefined
            ? conversion.outputFileId
            : input.outputFileId,
        errorCode:
          input.errorCode === undefined
            ? conversion.errorCode
            : input.errorCode,
        errorMessage:
          input.errorMessage === undefined
            ? conversion.errorMessage
            : input.errorMessage,
      };
      records.set(input.id, updated);
      return { ...updated };
    },
    async deleteById(id) {
      records.delete(id);
    },
    async deleteReferencingFile(fileId) {
      let deleted = 0;

      for (const [id, conversion] of [...records.entries()]) {
        if (
          conversion.sourceFileId === fileId ||
          conversion.outputFileId === fileId
        ) {
          records.delete(id);
          deleted += 1;
        }
      }

      return deleted;
    },
    async listExpired(input) {
      return [...records.values()]
        .filter(
          (conversion) =>
            conversion.expiresAt !== null &&
            conversion.expiresAt.getTime() <= input.now.getTime(),
        )
        .slice(0, input.limit)
        .map((conversion) => ({ ...conversion }));
    },
  };
}

function createFileLookup(files: FileRecord[]) {
  const records = new Map(files.map((file) => [file.id, file]));

  return {
    async findFileById(id: string) {
      return records.get(id);
    },
  };
}

const sourceFile = createFile();
const additionalFile = createFile({
  id: "550e8400-e29b-41d4-a716-446655440001",
  objectKey: "files/550e8400-e29b-41d4-a716-446655440001/original",
});
const outputFile = createFile({
  id: "550e8400-e29b-41d4-a716-446655440002",
  objectKey: "files/550e8400-e29b-41d4-a716-446655440002/original",
});

describe("conversion service", () => {
  test("creates a pending conversion without an output file", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile]),
      now: () => new Date("2026-08-23T18:30:00.000Z"),
    });

    const conversion = await service.createConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      type: "pdf-to-jpg",
      sourceFormat: "pdf",
      targetFormat: "jpeg",
      options: { page: 1, quality: 90 },
    });

    expect(conversion.status).toBe("pending");
    expect(conversion.sourceFileId).toBe(sourceFile.id);
    expect(conversion.outputFileId).toBeNull();
    expect(conversion.targetFormat).toBe("jpg");
    expect(conversion.options).toEqual({
      type: "pdf-to-jpg",
      page: 1,
      quality: 90,
    });
  });

  test("rejects unsupported conversions", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile]),
    });

    try {
      await service.createConversion({
        ownerId: sourceFile.ownerId,
        sourceFileId: sourceFile.id,
        type: "pdf-to-jpg",
        sourceFormat: "pdf",
        targetFormat: "png",
      });
      throw new Error("expected unsupported conversion to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.message).toBe("Invalid target format");
      }
    }
  });

  test("rejects unavailable source files", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([
        createFile({
          status: "pending",
        }),
      ]),
    });

    try {
      await service.createConversion({
        ownerId: sourceFile.ownerId,
        sourceFileId: sourceFile.id,
        type: "pdf-to-jpg",
        sourceFormat: "pdf",
        targetFormat: "jpg",
      });
      throw new Error("expected unavailable source to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFLICT");
        expect(error.message).toBe("Source file unavailable");
      }
    }
  });

  test("returns the existing conversion for a matching idempotency key", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile]),
      now: () => new Date("2026-08-23T18:30:00.000Z"),
    });
    const input = {
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      type: "compress-pdf" as const,
      sourceFormat: "pdf",
      targetFormat: "pdf",
      idempotencyKey: "compress-report-1",
    };

    const first = await service.createConversion(input);
    const second = await service.createConversion(input);

    expect(second.id).toBe(first.id);
  });

  test("follows valid status transitions and records completion", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile, outputFile]),
      now: () => new Date("2026-08-23T18:40:00.000Z"),
    });
    const created = await service.createConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      type: "png-to-pdf",
      sourceFormat: "png",
      targetFormat: "pdf",
    });

    const queued = await service.markQueued(created.id);
    const processing = await service.markProcessing(created.id);
    const completed = await service.markCompleted(created.id, {
      outputFileId: outputFile.id,
    });

    expect(queued.status).toBe("queued");
    expect(processing.status).toBe("processing");
    expect(completed.status).toBe("completed");
    expect(completed.outputFileId).toBe(outputFile.id);
    expect(completed.completedAt?.toISOString()).toBe(
      "2026-08-23T18:40:00.000Z",
    );
  });

  test("rejects invalid status transitions", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile]),
      now: () => new Date("2026-08-23T18:30:00.000Z"),
    });
    const created = await service.createConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      type: "pdf-to-word",
      sourceFormat: "pdf",
      targetFormat: "docx",
    });

    try {
      await service.markProcessing(created.id);
      throw new Error("expected invalid transition to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFLICT");
      }
    }
  });

  test("cancels a pending conversion", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile, additionalFile]),
      now: () => new Date("2026-08-23T18:30:00.000Z"),
    });
    const created = await service.createConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      type: "merge-pdf",
      sourceFormat: "pdf",
      targetFormat: "pdf",
      options: { additionalFileIds: [additionalFile.id] },
    });

    const cancelled = await service.cancelConversion(created.id);
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.errorCode).toBe("cancelled");
  });

  test("hides another user's source file during creation", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile]),
    });

    try {
      await service.createOwnedConversion({
        ownerId: "user_2",
        sourceFileId: sourceFile.id,
        targetFormat: "jpg",
      });
      throw new Error("expected foreign file to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("NOT_FOUND");
        expect(error.message).toBe("File not found");
      }
    }
  });

  test("rejects expired and deleted source files as not found", async () => {
    const expired = createFile({
      expiresAt: new Date("2026-08-23T18:00:00.000Z"),
    });
    const deleted = createFile({
      id: "550e8400-e29b-41d4-a716-446655440003",
      objectKey: "files/550e8400-e29b-41d4-a716-446655440003/original",
      deletedAt: new Date("2026-08-23T18:10:00.000Z"),
      status: "deleted",
    });
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([expired, deleted]),
      now: () => new Date("2026-08-23T18:30:00.000Z"),
    });

    for (const sourceFileId of [expired.id, deleted.id]) {
      try {
        await service.createOwnedConversion({
          ownerId: sourceFile.ownerId,
          sourceFileId,
          targetFormat: "jpg",
        });
        throw new Error("expected unavailable file to fail");
      } catch (error) {
        expect(isAppError(error)).toBe(true);
        if (isAppError(error)) {
          expect(error.code).toBe("NOT_FOUND");
        }
      }
    }
  });

  test("derives an implemented conversion type from the source file", async () => {
    const png = createFile({
      id: "550e8400-e29b-41d4-a716-446655440004",
      originalFilename: "image.png",
      mimeType: "image/png",
      objectKey: "files/550e8400-e29b-41d4-a716-446655440004/original",
    });
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([png]),
    });

    const conversion = await service.createOwnedConversion({
      ownerId: png.ownerId,
      sourceFileId: png.id,
      targetFormat: "pdf",
    });

    expect(conversion.ownerId).toBe(png.ownerId);
    expect(conversion.type).toBe("png-to-pdf");
    expect(conversion.sourceFormat).toBe("png");
    expect(conversion.status).toBe("pending");
  });

  test("requires a type when multiple implemented conversions match", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile]),
    });

    try {
      await service.createOwnedConversion({
        ownerId: sourceFile.ownerId,
        sourceFileId: sourceFile.id,
        targetFormat: "pdf",
      });
      throw new Error("expected ambiguous conversion to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.message).toBe("Unsupported conversion");
      }
    }

    const conversion = await service.createOwnedConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      targetFormat: "pdf",
      type: "compress-pdf",
    });

    expect(conversion.type).toBe("compress-pdf");
  });

  test("keeps idempotency keys scoped to the owner", async () => {
    const otherFile = createFile({
      id: "550e8400-e29b-41d4-a716-446655440005",
      ownerId: "user_2",
      objectKey: "files/550e8400-e29b-41d4-a716-446655440005/original",
    });
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile, otherFile]),
    });

    const first = await service.createOwnedConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      targetFormat: "jpg",
      idempotencyKey: "convert-1",
    });
    const second = await service.createOwnedConversion({
      ownerId: otherFile.ownerId,
      sourceFileId: otherFile.id,
      targetFormat: "jpg",
      idempotencyKey: "convert-1",
    });

    expect(second.id).not.toBe(first.id);
    expect(second.ownerId).toBe("user_2");
  });

  test("lists only the owner's conversions and hides others on get", async () => {
    const otherFile = createFile({
      id: "550e8400-e29b-41d4-a716-446655440006",
      ownerId: "user_2",
      objectKey: "files/550e8400-e29b-41d4-a716-446655440006/original",
    });
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile, otherFile]),
    });
    const owned = await service.createOwnedConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      targetFormat: "jpg",
    });
    await service.createOwnedConversion({
      ownerId: otherFile.ownerId,
      sourceFileId: otherFile.id,
      targetFormat: "jpg",
    });

    const listed = await service.listOwnedConversions({
      ownerId: sourceFile.ownerId,
      limit: 20,
    });

    expect(listed.conversions.map((item) => item.id)).toEqual([owned.id]);
    expect(listed.nextCursor).toBeNull();

    try {
      await service.getOwnedConversion(owned.id, "user_2");
      throw new Error("expected foreign conversion to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("NOT_FOUND");
      }
    }
  });

  test("marks a pending conversion failed when queueing cannot proceed", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile]),
    });
    const created = await service.createOwnedConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      targetFormat: "jpg",
    });

    const failed = await service.markFailed(created.id, {
      errorCode: "processing_failed",
      errorMessage: "Conversion could not be queued",
    });

    expect(failed.status).toBe("failed");
    expect(failed.errorCode).toBe("processing_failed");
  });

  test("passes merge options through owned conversion creation", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile, additionalFile]),
    });

    const conversion = await service.createOwnedConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      targetFormat: "pdf",
      type: "merge-pdf",
      options: { additionalFileIds: [additionalFile.id] },
    });

    expect(conversion.options).toEqual({
      type: "merge-pdf",
      additionalFileIds: [additionalFile.id],
    });
  });

  test("returns expired owned conversions for history metadata", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile]),
      now: () => new Date("2026-08-23T18:30:00.000Z"),
    });
    const created = await service.createOwnedConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      targetFormat: "jpg",
      expiresAt: new Date("2026-08-23T18:00:00.000Z"),
    });

    const loaded = await service.getOwnedConversion(
      created.id,
      sourceFile.ownerId,
    );

    expect(loaded.id).toBe(created.id);
    expect(loaded.expiresAt?.toISOString()).toBe("2026-08-23T18:00:00.000Z");
  });

  test("deletes expired conversions idempotently", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile]),
      now: () => new Date("2026-08-23T18:30:00.000Z"),
    });
    const created = await service.createOwnedConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      targetFormat: "jpg",
      expiresAt: new Date("2026-08-23T18:00:00.000Z"),
    });

    const first = await service.cleanupExpiredConversions();
    const second = await service.cleanupExpiredConversions();

    expect(first).toEqual({ scanned: 1, deleted: 1 });
    expect(second).toEqual({ scanned: 0, deleted: 0 });

    try {
      await service.getOwnedConversion(created.id, sourceFile.ownerId);
      throw new Error("expected missing conversion");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("NOT_FOUND");
      }
    }
  });

  test("detaches conversions that reference a file before hard delete", async () => {
    const service = createConversionService({
      repository: createMemoryRepository(),
      files: createFileLookup([sourceFile]),
      now: () => new Date("2026-08-23T18:30:00.000Z"),
    });
    await service.createOwnedConversion({
      ownerId: sourceFile.ownerId,
      sourceFileId: sourceFile.id,
      targetFormat: "jpg",
      expiresAt: new Date("2026-08-23T20:00:00.000Z"),
    });

    const deleted = await service.deleteReferencingFile(sourceFile.id);
    expect(deleted).toBe(1);
    expect(
      (await service.listOwnedConversions({ ownerId: sourceFile.ownerId }))
        .conversions,
    ).toEqual([]);
  });
});
