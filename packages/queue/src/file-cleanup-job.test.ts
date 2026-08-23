import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  createFileCleanupJob,
  parseFileCleanupJobData,
} from "./file-cleanup-job.js";
import { FILE_CLEANUP_JOB_NAME } from "./queue-settings.js";

describe("file cleanup job", () => {
  test("uses an empty payload without file contents or credentials", () => {
    expect(createFileCleanupJob()).toEqual({
      name: FILE_CLEANUP_JOB_NAME,
      data: {},
    });
    expect(parseFileCleanupJobData({})).toEqual({});
  });

  test("rejects extra or sensitive payload fields", () => {
    try {
      parseFileCleanupJobData({ url: "https://example.invalid" });
      throw new Error("expected payload to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
