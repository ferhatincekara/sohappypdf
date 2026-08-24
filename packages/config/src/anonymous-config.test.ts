import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  DEFAULT_ANONYMOUS_MAX_FILE_SIZE_BYTES,
  DEFAULT_ANONYMOUS_MAX_FILES_PER_OPERATION,
  DEFAULT_ANONYMOUS_OPERATIONS_PER_HOUR,
  DEFAULT_ANONYMOUS_RETENTION_MS,
  loadAnonymousConfig,
} from "./anonymous-config.js";

describe("loadAnonymousConfig", () => {
  test("uses centralized anonymous defaults", () => {
    const config = loadAnonymousConfig({});

    expect(config.maxFileSizeBytes).toBe(DEFAULT_ANONYMOUS_MAX_FILE_SIZE_BYTES);
    expect(config.maxFileSizeBytes).toBe(25 * 1024 * 1024);
    expect(config.maxFilesPerOperation).toBe(
      DEFAULT_ANONYMOUS_MAX_FILES_PER_OPERATION,
    );
    expect(config.operationsPerHour).toBe(
      DEFAULT_ANONYMOUS_OPERATIONS_PER_HOUR,
    );
    expect(config.retentionMs).toBe(DEFAULT_ANONYMOUS_RETENTION_MS);
    expect(config.retentionMs).toBe(2 * 60 * 60 * 1000);
  });

  test("reads anonymous limit overrides", () => {
    const config = loadAnonymousConfig({
      ANONYMOUS_MAX_FILE_SIZE_BYTES: "1048576",
      ANONYMOUS_MAX_FILES_PER_OPERATION: "3",
      ANONYMOUS_OPERATIONS_PER_HOUR: "4",
      ANONYMOUS_RETENTION_HOURS: "1",
    });

    expect(config.maxFileSizeBytes).toBe(1_048_576);
    expect(config.maxFilesPerOperation).toBe(3);
    expect(config.operationsPerHour).toBe(4);
    expect(config.retentionMs).toBe(60 * 60 * 1000);
  });

  test("rejects non-positive anonymous limits", () => {
    try {
      loadAnonymousConfig({ ANONYMOUS_OPERATIONS_PER_HOUR: "0" });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
