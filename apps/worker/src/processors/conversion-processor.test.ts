import { describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { DEFAULT_WORKER_CONFIG } from "@sohappypdf/config";
import type {
  ConversionEngine,
  EngineRegistry,
} from "@sohappypdf/conversion-engines";
import type {
  ConversionOptions,
  ConversionRecord,
  ConversionService,
} from "@sohappypdf/conversions";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { FileRecord, FileService } from "@sohappypdf/files";
import { createLogger } from "@sohappypdf/logger";
import type { ConversionJobData } from "@sohappypdf/queue";
import type { Storage } from "@sohappypdf/storage";
import { PDFDocument } from "pdf-lib";
import { PermanentConversionError } from "../job-errors.js";
import { createConversionProcessor } from "./conversion-processor.js";
import { DATABASE_FALLBACK_JOB_PREFIX } from "./pending-conversion-poller.js";

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
    purgedAt: null,
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
          return createConversion({ type: "ocr-image", status: "queued" });
        },
        async markProcessing() {
          return createConversion({ type: "ocr-image", status: "processing" });
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
      await processor(
        createJob({
          conversionType: "ocr-image",
          sourceFormat: "jpg",
          targetFormat: "txt",
          options: { type: "ocr-image", language: "eng", outputMode: "txt" },
        }),
      );
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

  test("marks invalid conversion options as failed", async () => {
    const failed: unknown[] = [];
    const processor = createConversionProcessor({
      conversions: {
        async getConversion() {
          return createConversion({
            type: "extract-pages",
            sourceFormat: "pdf",
            targetFormat: "pdf",
            status: "queued",
            options: { type: "extract-pages", unexpected: true },
          });
        },
        async markProcessing() {
          return createConversion({
            type: "extract-pages",
            sourceFormat: "pdf",
            targetFormat: "pdf",
            status: "processing",
            options: { type: "extract-pages", unexpected: true },
          });
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
          return createFile({
            mimeType: "application/pdf",
            originalFilename: "doc.pdf",
          });
        },
      } as unknown as FileService,
      storage: {
        async objectExists() {
          return false;
        },
      } as unknown as Storage,
      engines: {
        resolve() {
          throw new Error("engine should not run");
        },
      },
      config: DEFAULT_WORKER_CONFIG,
      logger: createLogger({ level: "error" }),
    });

    await expect(
      processor(
        createJob({
          conversionType: "extract-pages",
          sourceFormat: "pdf",
          targetFormat: "pdf",
          options: { type: "extract-pages", unexpected: true },
        }),
      ),
    ).rejects.toBeTruthy();

    expect(failed).toEqual([
      {
        errorCode: "invalid_options",
        errorMessage: "Invalid conversion options",
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

  test("loads protect-pdf password from the conversion record", async () => {
    const receivedOptions: ConversionOptions[] = [];
    const protectOptions = {
      type: "protect-pdf",
      password: "secret",
    } as const;

    const processor = createConversionProcessor({
      conversions: {
        async getConversion() {
          return createConversion({
            type: "protect-pdf",
            sourceFormat: "pdf",
            targetFormat: "pdf",
            status: "queued",
            options: protectOptions,
          });
        },
        async markProcessing() {
          return createConversion({
            type: "protect-pdf",
            sourceFormat: "pdf",
            targetFormat: "pdf",
            status: "processing",
            options: protectOptions,
          });
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
            return undefined;
          }

          return createFile({
            originalFilename: "doc.pdf",
            mimeType: "application/pdf",
          });
        },
        async registerStoredFile() {
          return createFile({
            id: conversionId,
            originalFilename: "output.pdf",
            mimeType: "application/pdf",
          });
        },
      } as unknown as FileService,
      storage: {
        async objectExists() {
          return false;
        },
        async getObjectMetadata() {
          return { contentLength: 32 };
        },
        async downloadObjectToFile(input: { destination: string }) {
          const document = await PDFDocument.create();
          document.addPage([200, 200]);
          await writeFile(input.destination, await document.save());
          return { sizeBytes: 32 };
        },
        async uploadObjectFromFile() {},
      } as unknown as Storage,
      engines: {
        resolve() {
          return {
            name: "pdf-security",
            types: ["protect-pdf"],
            canHandle() {
              return true;
            },
            supports() {
              return true;
            },
            async convert(input) {
              receivedOptions.push(input.options);
              const document = await PDFDocument.create();
              document.addPage([200, 200]);
              const outputPath = `${input.outputDirectory}/output.pdf`;
              await writeFile(outputPath, await document.save());
              return {
                outputPath,
                mimeType: "application/pdf",
                filename: "output.pdf",
              };
            },
          } satisfies ConversionEngine;
        },
      },
      config: DEFAULT_WORKER_CONFIG,
      logger: createLogger({ level: "error" }),
    });

    await processor(
      createJob({
        conversionType: "protect-pdf",
        sourceFormat: "pdf",
        targetFormat: "pdf",
        options: { type: "protect-pdf" },
      }),
    );

    expect(receivedOptions).toEqual([protectOptions]);
  });

  test("does not convert a database fallback job that is already processing", async () => {
    const converted: string[] = [];
    const processor = createConversionProcessor({
      conversions: {
        async getConversion() {
          return createConversion({ status: "processing" });
        },
        async markProcessing() {
          throw new Error("should not claim");
        },
      } as unknown as ConversionService,
      files: {} as FileService,
      storage: {} as Storage,
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

    await processor({
      ...createJob(),
      id: `${DATABASE_FALLBACK_JOB_PREFIX}${conversionId}`,
    });
    expect(converted).toEqual([]);
  });

  test("stops when another worker already claimed the conversion", async () => {
    const converted: string[] = [];
    const processor = createConversionProcessor({
      conversions: {
        async getConversion() {
          return createConversion({ status: "queued" });
        },
        async markProcessing() {
          throw new AppError({
            code: APP_ERROR_CODES.NOT_FOUND,
            message: "Conversion not found",
          });
        },
      } as unknown as ConversionService,
      files: {} as FileService,
      storage: {} as Storage,
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

  test("marks a database fallback job failed after a transient error", async () => {
    const failed: string[] = [];
    const processor = createConversionProcessor({
      conversions: {
        async getConversion() {
          return createConversion({ status: "queued" });
        },
        async markProcessing() {
          return createConversion({ status: "processing" });
        },
        async markFailed(id) {
          failed.push(id);
          return createConversion({ status: "failed" });
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
          throw new Error("engine crashed");
        },
      },
      config: DEFAULT_WORKER_CONFIG,
      logger: createLogger({ level: "error" }),
    });

    try {
      await processor({
        ...createJob(),
        id: `${DATABASE_FALLBACK_JOB_PREFIX}${conversionId}`,
      });
      throw new Error("expected transient failure");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("engine crashed");
    }

    expect(failed).toEqual([conversionId]);
  });
});
