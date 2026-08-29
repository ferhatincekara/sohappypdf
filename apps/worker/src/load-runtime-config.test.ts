import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { loadWorkerRuntimeConfig } from "./load-runtime-config.js";

const validEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost/sohappypdf",
  UPSTASH_REDIS_REST_URL: "https://example-123.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
  AWS_REGION: "eu-central-1",
  AWS_ACCESS_KEY_ID: "AKIATEST",
  AWS_SECRET_ACCESS_KEY: "secret",
  S3_BUCKET_NAME: "sohappypdf-files",
};

describe("loadWorkerRuntimeConfig", () => {
  test("loads required infrastructure configuration", () => {
    const config = loadWorkerRuntimeConfig(validEnv);

    expect(config.worker.concurrency).toBe(1);
    expect(config.database.url).toBe(validEnv.DATABASE_URL);
    expect(config.queue.restUrl).toBe(validEnv.UPSTASH_REDIS_REST_URL);
    expect(config.storage.bucket).toBe(validEnv.S3_BUCKET_NAME);
  });

  test("fails fast when required configuration is missing", () => {
    try {
      loadWorkerRuntimeConfig({});
      throw new Error("expected missing configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFIGURATION_ERROR");
        expect(error.message).toContain("DATABASE_URL");
      }
    }
  });
});
