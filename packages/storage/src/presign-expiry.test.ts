import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  DEFAULT_PRESIGN_EXPIRES_IN_SECONDS,
  MAX_PRESIGN_EXPIRES_IN_SECONDS,
  resolvePresignExpiresInSeconds,
} from "./presign-expiry.js";

describe("presign expiry", () => {
  test("defaults to a short-lived URL", () => {
    expect(resolvePresignExpiresInSeconds(undefined)).toBe(
      DEFAULT_PRESIGN_EXPIRES_IN_SECONDS,
    );
    expect(DEFAULT_PRESIGN_EXPIRES_IN_SECONDS).toBe(15 * 60);
    expect(MAX_PRESIGN_EXPIRES_IN_SECONDS).toBe(60 * 60);
  });

  test("rejects multi-day expirations", () => {
    try {
      resolvePresignExpiresInSeconds(7 * 24 * 60 * 60);
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
