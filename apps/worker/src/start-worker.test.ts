import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import { startConversionWorkerRuntime } from "./start-worker.js";

const validEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:pass@localhost/sohappypdf",
  UPSTASH_REDIS_REST_URL: "https://example-123.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
  AWS_REGION: "eu-central-1",
  AWS_ACCESS_KEY_ID: "AKIATEST",
  AWS_SECRET_ACCESS_KEY: "secret",
  S3_BUCKET_NAME: "sohappypdf-files",
  WORKER_CONCURRENCY: "1",
};

describe("startConversionWorkerRuntime", () => {
  test("initializes after configuration and environment checks succeed", async () => {
    let created = false;
    const runtime = await startConversionWorkerRuntime({
      env: validEnv,
      listenHealth: false,
      checks: {
        probeBinaries() {
          return [{ command: "soffice", available: true, version: "24.2" }];
        },
        async pingDatabase() {},
        async pingQueue() {},
        async pingStorage() {},
      },
      createProcessor() {
        return async () => undefined;
      },
      createQueueWorker() {
        created = true;
        return {
          async close() {},
        };
      },
    });

    expect(created).toBe(true);
    expect(await runtime.shutdown("SIGTERM")).toBe(0);
  });

  test("does not start when required infrastructure is unavailable", async () => {
    try {
      await startConversionWorkerRuntime({
        env: validEnv,
        listenHealth: false,
        checks: {
          probeBinaries() {
            return [{ command: "soffice", available: true }];
          },
          async pingDatabase() {},
          async pingQueue() {
            throw new Error("redis down");
          },
          async pingStorage() {},
        },
        createProcessor() {
          return async () => undefined;
        },
        createQueueWorker() {
          throw new Error("worker should not start");
        },
      });
      throw new Error("expected startup to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
