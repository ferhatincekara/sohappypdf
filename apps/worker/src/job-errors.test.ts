import { describe, expect, test } from "bun:test";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import {
  isRetryableConversionError,
  PermanentConversionError,
  toSafeFailure,
} from "./job-errors.js";

describe("conversion errors", () => {
  test("classifies permanent and transient failures", () => {
    expect(
      isRetryableConversionError(
        new PermanentConversionError("unsupported_conversion", "Unsupported"),
      ),
    ).toBe(false);
    expect(
      isRetryableConversionError(
        new AppError({
          code: APP_ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid",
        }),
      ),
    ).toBe(false);
    expect(
      isRetryableConversionError(
        new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Storage operation failed",
        }),
      ),
    ).toBe(true);
    expect(isRetryableConversionError(new Error("socket hang up"))).toBe(true);
  });

  test("exposes only safe failure information", () => {
    expect(
      toSafeFailure(
        new PermanentConversionError(
          "invalid_options",
          "Invalid conversion options",
        ),
      ),
    ).toEqual({
      errorCode: "invalid_options",
      errorMessage: "Invalid conversion options",
    });
    expect(toSafeFailure(new Error("/var/lib/sohappypdf/secret.pdf"))).toEqual({
      errorCode: "processing_failed",
      errorMessage: "Conversion failed",
    });
  });
});
