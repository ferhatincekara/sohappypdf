import { describe, expect, test } from "bun:test";
import axios from "axios";
import {
  CONVERSION_ERROR_KEYS,
  mapConversionError,
  toConversionClientError,
} from "@/features/conversions/api/conversion-errors";

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
    expect(
      mapConversionError({
        kind: "api",
        code: "FILE_EXPIRED",
        status: 410,
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

  test("keeps a safe Pro-only tool message", () => {
    expect(
      toConversionClientError(
        new axios.AxiosError(
          "Request failed with status code 403",
          "ERR_BAD_REQUEST",
          { url: "/v1/conversions", method: "post" },
          undefined,
          {
            status: 403,
            statusText: "Forbidden",
            headers: {},
            config: { url: "/v1/conversions" },
            data: {
              error: {
                code: "PLAN_LIMIT_REACHED",
                message: "This tool requires Pro",
              },
            },
          } as never,
        ),
      ).message,
    ).toBe("This tool requires Pro");
    expect(
      mapConversionError({
        kind: "api",
        code: "PLAN_LIMIT_REACHED",
        status: 403,
        message: "This tool requires Pro",
      }),
    ).toBe(CONVERSION_ERROR_KEYS.upgradeRequired);
  });

  test("keeps a safe AI credit limit message", () => {
    expect(
      toConversionClientError(
        new axios.AxiosError(
          "Request failed with status code 403",
          "ERR_BAD_REQUEST",
          { url: "/v1/conversions", method: "post" },
          undefined,
          {
            status: 403,
            statusText: "Forbidden",
            headers: {},
            config: { url: "/v1/conversions" },
            data: {
              error: {
                code: "PLAN_LIMIT_REACHED",
                message: "Monthly AI credit limit reached",
              },
            },
          } as never,
        ),
      ).message,
    ).toBe("Monthly AI credit limit reached");
  });

  test("keeps a safe AI unavailable message", () => {
    expect(
      toConversionClientError(
        new axios.AxiosError(
          "Request failed with status code 500",
          "ERR_BAD_RESPONSE",
          { url: "/v1/conversions", method: "post" },
          undefined,
          {
            status: 500,
            statusText: "Internal Server Error",
            headers: {},
            config: { url: "/v1/conversions" },
            data: {
              error: {
                code: "CONFIGURATION_ERROR",
                message: "AI processing is unavailable",
              },
            },
          } as never,
        ),
      ).message,
    ).toBe("AI processing is unavailable");
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
