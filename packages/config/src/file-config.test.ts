import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import { DEFAULT_FILE_CONFIG, loadFileConfig } from "./file-config.js";

describe("loadFileConfig", () => {
  test("uses the centralized upload size default", () => {
    expect(loadFileConfig({}).maxUploadFileSizeBytes).toBe(
      DEFAULT_FILE_CONFIG.maxUploadFileSizeBytes,
    );
  });

  test("rejects a non-positive upload size", () => {
    try {
      loadFileConfig({ MAX_UPLOAD_FILE_SIZE: "0" });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
