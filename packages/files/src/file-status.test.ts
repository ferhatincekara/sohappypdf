import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  assertFileStatusTransition,
  canTransitionFileStatus,
  isFileStatus,
} from "./file-status.js";

describe("file status", () => {
  test("accepts the defined lifecycle values", () => {
    expect(isFileStatus("pending")).toBe(true);
    expect(isFileStatus("uploaded")).toBe(true);
    expect(isFileStatus("archived")).toBe(false);
  });

  test("allows the upload and conversion transitions", () => {
    expect(canTransitionFileStatus("pending", "uploaded")).toBe(true);
    expect(canTransitionFileStatus("uploaded", "processing")).toBe(true);
    expect(canTransitionFileStatus("processing", "completed")).toBe(true);
    expect(canTransitionFileStatus("processing", "failed")).toBe(true);
  });

  test("allows deletion from active states", () => {
    expect(canTransitionFileStatus("pending", "deleted")).toBe(true);
    expect(canTransitionFileStatus("uploaded", "deleted")).toBe(true);
    expect(canTransitionFileStatus("completed", "deleted")).toBe(true);
    expect(canTransitionFileStatus("failed", "deleted")).toBe(true);
  });

  test("rejects illegal transitions", () => {
    expect(canTransitionFileStatus("pending", "completed")).toBe(false);
    expect(canTransitionFileStatus("completed", "uploaded")).toBe(false);
    expect(canTransitionFileStatus("deleted", "pending")).toBe(false);

    try {
      assertFileStatusTransition("failed", "uploaded");
      throw new Error("expected transition to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFLICT");
      }
    }
  });
});
