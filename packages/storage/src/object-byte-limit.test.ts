import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { assertObjectByteLimit } from "./object-byte-limit.js";

describe("assertObjectByteLimit", () => {
  test("allows a file within the configured limit", () => {
    expect(() => assertObjectByteLimit(8, 16)).not.toThrow();
  });

  test("rejects oversized objects without reading more bytes", () => {
    try {
      assertObjectByteLimit(17, 16);
      throw new Error("expected size limit to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("VALIDATION_ERROR");
      }
    }
  });
});
