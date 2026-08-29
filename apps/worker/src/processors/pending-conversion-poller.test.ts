import { describe, expect, test } from "bun:test";
import type { ConversionRecord } from "@sohappypdf/conversions";
import type { FileRecord } from "@sohappypdf/files";
import type { Logger } from "@sohappypdf/logger";
import { startPendingConversionPoller } from "./pending-conversion-poller.js";

const silentLogger: Logger = {
  level: "error",
  error() {},
  warn() {},
  info() {},
  debug() {},
  child() {
    return silentLogger;
  },
};

function createPendingConversion(): ConversionRecord {
  const now = new Date("2026-08-29T12:00:00.000Z");
  return {
    id: "11111111-1111-4111-8111-111111111111",
    ownerId: "user_1",
    ownerKind: "user",
    sourceFileId: "22222222-2222-4222-8222-222222222222",
    outputFileId: null,
    type: "pdf-to-png",
    sourceFormat: "pdf",
    targetFormat: "png",
    status: "pending",
    options: { type: "pdf-to-png" },
    errorCode: null,
    errorMessage: null,
    idempotencyKey: null,
    createdAt: now,
    updatedAt: now,
    queuedAt: null,
    startedAt: null,
    completedAt: null,
    expiresAt: new Date("2026-08-29T14:00:00.000Z"),
  };
}

function createSourceFile(conversion: ConversionRecord): FileRecord {
  return {
    id: conversion.sourceFileId,
    ownerId: conversion.ownerId,
    ownerKind: "user",
    objectKey: "users/user_1/source.pdf",
    originalFilename: "source.pdf",
    contentType: "application/pdf",
    size: 128,
    status: "uploaded",
    createdAt: conversion.createdAt,
    updatedAt: conversion.updatedAt,
    expiresAt: conversion.expiresAt ?? conversion.createdAt,
    deletedAt: null,
  };
}

describe("startPendingConversionPoller", () => {
  test("processes pending conversions from the database when Redis is down", async () => {
    const conversion = createPendingConversion();
    const processed: string[] = [];
    const poller = startPendingConversionPoller({
      conversions: {
        async listPendingForProcessing() {
          return [conversion];
        },
        async markFailed() {
          throw new Error("should process instead");
        },
      } as never,
      files: {
        async findFileById() {
          return createSourceFile(conversion);
        },
      } as never,
      async processJob(job) {
        processed.push(job.data.conversionId);
      },
      logger: silentLogger,
      intervalMs: 60_000,
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    poller.stop();

    expect(processed).toEqual([conversion.id]);
  });
});
