import { describe, expect, test } from "bun:test";
import { CONVERSION_ERROR_KEYS, mapConversionError } from "./conversion-errors";

describe("conversion error mapping", () => {
  test("maps an unsupported conversion without exposing internals", () => {
    expect(
      mapConversionError({
        kind: "api",
        code: "VALIDATION_ERROR",
        message: "Unsupported conversion",
      }),
    ).toBe(CONVERSION_ERROR_KEYS.unsupportedConversion);
    expect(
      mapConversionError({
        kind: "api",
        code: "VALIDATION_ERROR",
        message: "relation conversions does not exist",
      }),
    ).toBe(CONVERSION_ERROR_KEYS.unsupportedConversion);
  });

  test("maps a missing file and an unavailable source file", () => {
    expect(
      mapConversionError({
        kind: "api",
        code: "NOT_FOUND",
        message: "File not found",
      }),
    ).toBe(CONVERSION_ERROR_KEYS.notFound);
    expect(
      mapConversionError({
        kind: "api",
        code: "CONFLICT",
        message: "Source file unavailable",
      }),
    ).toBe(CONVERSION_ERROR_KEYS.sourceUnavailable);
  });

  test("maps a monthly conversion limit", () => {
    expect(
      mapConversionError({
        kind: "api",
        code: "PLAN_LIMIT_REACHED",
        status: 403,
      }),
    ).toBe(CONVERSION_ERROR_KEYS.planLimitReached);
  });

  test("maps a rate-limit response", () => {
    expect(
      mapConversionError({
        kind: "api",
        code: "RATE_LIMITED",
        status: 429,
        message: "Too many requests",
      }),
    ).toBe(CONVERSION_ERROR_KEYS.rateLimited);
  });

  test("maps a network failure", () => {
    expect(mapConversionError({ kind: "network", status: 0 })).toBe(
      CONVERSION_ERROR_KEYS.networkFailure,
    );
  });
});
