import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import {
  DEFAULT_FILE_CONFIG,
  DEFAULT_FILE_RETENTION_MS,
  loadFileConfig,
} from "./file-config.js";

describe("loadFileConfig", () => {
  test("uses the centralized upload size and two-hour retention defaults", () => {
    const config = loadFileConfig({});

    expect(config.maxUploadFileSizeBytes).toBe(
      DEFAULT_FILE_CONFIG.maxUploadFileSizeBytes,
    );
    expect(config.retentionMs).toBe(DEFAULT_FILE_RETENTION_MS);
    expect(config.retentionMs).toBe(2 * 60 * 60 * 1000);
    expect(config.cleanupBatchSize).toBe(100);
  });

  test("reads FILE_RETENTION_HOURS as the product retention policy", () => {
    expect(loadFileConfig({ FILE_RETENTION_HOURS: "24" }).retentionMs).toBe(
      24 * 60 * 60 * 1000,
    );
  });

  test("rejects a non-positive upload size or retention", () => {
    try {
      loadFileConfig({ MAX_UPLOAD_FILE_SIZE: "0" });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }

    try {
      loadFileConfig({ FILE_RETENTION_HOURS: "0" });
      throw new Error("expected retention to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
