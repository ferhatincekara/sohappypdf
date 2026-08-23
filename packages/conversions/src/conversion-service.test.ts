import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import type { FileRecord } from "@repo/files";
import type { ConversionRepository } from "./conversion-repository.js";
import { createConversionService } from "./conversion-service.js";
import type { ConversionRecord } from "./conversion-types.js";

function createFile(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    originalFilename: "report.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
    objectKey: "files/550e8400-e29b-41d4-a716-446655440000/original",
    status: "uploaded",
    createdAt: new Date("2026-08-23T18:00:00.000Z"),
    updatedAt: new Date("2026-08-23T18:00:00.000Z"),
    expiresAt: new Date("2026-08-23T20:00:00.000Z"),
    deletedAt: null,
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
    async findByIdempotencyKey(key) {
      const conversion = [...records.values()].find(
        (item) => item.idempotencyKey === key,
      );
      return conversion === undefined ? undefined : { ...conversion };
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
    });
    const input = {
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
    });
    const created = await service.createConversion({
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
    });
    const created = await service.createConversion({
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
});
