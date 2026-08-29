import { describe, expect, test } from "bun:test";
import type { ConversionRecord } from "@sohappypdf/conversions";
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

async function waitForPoll(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 20);
  });
}

describe("startPendingConversionPoller", () => {
  test("claims a pending conversion before processing it", async () => {
    const conversion = createPendingConversion();
    const claimed: string[] = [];
    const processed: string[] = [];
    const poller = startPendingConversionPoller({
      conversions: {
        async listPendingForProcessing() {
          return [conversion];
        },
        async claimPendingForProcessing(id) {
          claimed.push(id);
          return { ...conversion, status: "queued" };
        },
        async markFailed() {
          throw new Error("should process instead");
        },
      } as never,
      files: {
        async findFileById() {
          return {
            id: conversion.sourceFileId,
            objectKey: "users/user_1/source.pdf",
            deletedAt: null,
          };
        },
      } as never,
      async processJob(job) {
        processed.push(job.data.conversionId);
      },
      logger: silentLogger,
      intervalMs: 60_000,
    });

    await waitForPoll();
    poller.stop();

    expect(claimed).toEqual([conversion.id]);
    expect(processed).toEqual([conversion.id]);
  });

  test("skips a conversion another worker already claimed", async () => {
    const conversion = createPendingConversion();
    const processed: string[] = [];
    const poller = startPendingConversionPoller({
      conversions: {
        async listPendingForProcessing() {
          return [conversion];
        },
        async claimPendingForProcessing() {
          return undefined;
        },
      } as never,
      files: {
        async findFileById() {
          throw new Error("should not load the file");
        },
      } as never,
      async processJob(job) {
        processed.push(job.data.conversionId);
      },
      logger: silentLogger,
      intervalMs: 60_000,
    });

    await waitForPoll();
    poller.stop();

    expect(processed).toEqual([]);
  });

  test("marks the claimed conversion failed after a processing error", async () => {
    const conversion = createPendingConversion();
    const failed: string[] = [];
    const poller = startPendingConversionPoller({
      conversions: {
        async listPendingForProcessing() {
          return [conversion];
        },
        async claimPendingForProcessing() {
          return { ...conversion, status: "queued" };
        },
        async getConversion() {
          return { ...conversion, status: "queued" };
        },
        async markFailed(id) {
          failed.push(id);
          return { ...conversion, status: "failed" };
        },
      } as never,
      files: {
        async findFileById() {
          return {
            id: conversion.sourceFileId,
            objectKey: "users/user_1/source.pdf",
            deletedAt: null,
          };
        },
      } as never,
      async processJob() {
        throw new Error("engine failed");
      },
      logger: silentLogger,
      intervalMs: 60_000,
    });

    await waitForPoll();
    poller.stop();

    expect(failed).toEqual([conversion.id]);
  });

  test("does not fail a conversion another worker is already processing", async () => {
    const conversion = createPendingConversion();
    const failed: string[] = [];
    const poller = startPendingConversionPoller({
      conversions: {
        async listPendingForProcessing() {
          return [conversion];
        },
        async claimPendingForProcessing() {
          return { ...conversion, status: "queued" };
        },
        async getConversion() {
          return { ...conversion, status: "processing" };
        },
        async markFailed(id) {
          failed.push(id);
          return { ...conversion, status: "failed" };
        },
      } as never,
      files: {
        async findFileById() {
          return {
            id: conversion.sourceFileId,
            objectKey: "users/user_1/source.pdf",
            deletedAt: null,
          };
        },
      } as never,
      async processJob() {
        throw new Error("lost the claim");
      },
      logger: silentLogger,
      intervalMs: 60_000,
    });

    await waitForPoll();
    poller.stop();

    expect(failed).toEqual([]);
  });
});
