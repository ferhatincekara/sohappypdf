import { describe, expect, test } from "bun:test";
import { DEFAULT_WORKER_CONFIG } from "@repo/config";
import type {
  ConversionEngine,
  EngineRegistry,
} from "@repo/conversion-engines";
import type { ConversionRecord, ConversionService } from "@repo/conversions";
import type { FileRecord, FileService } from "@repo/files";
import { createLogger } from "@repo/logger";
import type { ConversionJobData } from "@repo/queue";
import type { Storage } from "@repo/storage";
import { PermanentConversionError } from "../job-errors.js";
import { createConversionProcessor } from "./conversion-processor.js";

const conversionId = "550e8400-e29b-41d4-a716-446655440300";
const sourceFileId = "550e8400-e29b-41d4-a716-446655440301";

function createConversion(
  overrides: Partial<ConversionRecord> = {},
): ConversionRecord {
  const now = new Date("2026-08-23T18:00:00.000Z");
  return {
    id: conversionId,
    ownerId: "user_1",
    sourceFileId,
    outputFileId: null,
    type: "png-to-pdf",
    sourceFormat: "png",
    targetFormat: "pdf",
    status: "queued",
    options: { type: "png-to-pdf" },
    errorCode: null,
    errorMessage: null,
    idempotencyKey: null,
    createdAt: now,
    updatedAt: now,
    queuedAt: now,
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}

function createFile(overrides: Partial<FileRecord> = {}): FileRecord {
  const now = new Date("2026-08-23T18:00:00.000Z");
  return {
    id: sourceFileId,
    ownerId: "user_1",
    originalFilename: "image.png",
    mimeType: "image/png",
    sizeBytes: 32,
    objectKey: `files/${sourceFileId}/original`,
    status: "uploaded",
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date("2026-08-23T20:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };
}

function createJob(overrides: Partial<ConversionJobData> = {}) {
  return {
    id: conversionId,
    attemptsMade: 0,
    data: {
      conversionId,
      sourceFileId,
      sourceObjectKey: `files/${sourceFileId}/original`,
      conversionType: "png-to-pdf",
      sourceFormat: "png",
      targetFormat: "pdf",
      options: { type: "png-to-pdf" },
      ...overrides,
    },
  };
}

describe("conversion processor", () => {
  test("skips an already completed conversion", async () => {
    const statuses: string[] = [];
    const processor = createConversionProcessor({
      conversions: {
        async getConversion() {
          return createConversion({
            status: "completed",
            outputFileId: conversionId,
          });
        },
        async markProcessing() {
          statuses.push("processing");
          return createConversion({ status: "processing" });
        },
      } as unknown as ConversionService,
      files: {} as FileService,
      storage: {} as Storage,
      engines: {} as EngineRegistry,
      config: DEFAULT_WORKER_CONFIG,
      logger: createLogger({ level: "error" }),
    });

    await processor(createJob());
    expect(statuses).toEqual([]);
  });

  test("marks unsupported conversions as permanent failures", async () => {
    const failed: unknown[] = [];
    const processor = createConversionProcessor({
      conversions: {
        async getConversion() {
          return createConversion({ type: "ocr-pdf", status: "queued" });
        },
        async markProcessing() {
          return createConversion({ type: "ocr-pdf", status: "processing" });
        },
        async markFailed(_id, input) {
          failed.push(input);
          return createConversion({ status: "failed" });
        },
        async findFileById() {
          return undefined;
        },
      } as unknown as ConversionService,
      files: {
        async findFileById() {
          return undefined;
        },
      } as unknown as FileService,
      storage: {
        async objectExists() {
          return false;
        },
      } as unknown as Storage,
      engines: {
        resolve() {
          throw new PermanentConversionError(
            "unsupported_conversion",
            "Unsupported conversion",
          );
        },
      },
      config: DEFAULT_WORKER_CONFIG,
      logger: createLogger({ level: "error" }),
    });

    try {
      await processor(createJob({ conversionType: "ocr-pdf" }));
      throw new Error("expected unsupported conversion");
    } catch (error) {
      expect(error).toBeInstanceOf(PermanentConversionError);
    }

    expect(failed).toEqual([
      {
        errorCode: "unsupported_conversion",
        errorMessage: "Unsupported conversion",
      },
    ]);
  });

  test("does not rerun work when a deterministic output already exists", async () => {
    const converted: string[] = [];
    const processor = createConversionProcessor({
      conversions: {
        async getConversion() {
          return createConversion({ status: "processing" });
        },
        async markCompleted() {
          return createConversion({
            status: "completed",
            outputFileId: conversionId,
          });
        },
      } as unknown as ConversionService,
      files: {
        async findFileById(id: string) {
          if (id === conversionId) {
            return createFile({
              id: conversionId,
              objectKey: `files/${sourceFileId}/output/${conversionId}`,
            });
          }

          return createFile();
        },
      } as unknown as FileService,
      storage: {
        async objectExists() {
          return true;
        },
      } as unknown as Storage,
      engines: {
        resolve() {
          return {
            name: "image-pdf",
            types: ["png-to-pdf"],
            canHandle() {
              return true;
            },
            supports() {
              return true;
            },
            async convert() {
              converted.push("ran");
              throw new Error("should not convert");
            },
          } satisfies ConversionEngine;
        },
      },
      config: DEFAULT_WORKER_CONFIG,
      logger: createLogger({ level: "error" }),
    });

    await processor(createJob());
    expect(converted).toEqual([]);
  });
});
