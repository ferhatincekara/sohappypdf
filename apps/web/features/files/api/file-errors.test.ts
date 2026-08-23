import { describe, expect, test } from "bun:test";
import axios from "axios";
import {
  FILE_ERROR_KEYS,
  mapFileError,
  mapUnknownUploadError,
  StorageUploadError,
  toFileClientError,
} from "./file-errors";

describe("file error mapping", () => {
  test("maps known API codes without exposing internals", () => {
    expect(
      mapFileError({
        kind: "api",
        code: "VALIDATION_ERROR",
        message: "Unsupported content type",
      }),
    ).toBe(FILE_ERROR_KEYS.unsupportedType);
    expect(
      mapFileError({
        kind: "api",
        code: "CONFLICT",
        message: "relation files does not exist",
      }),
    ).toBe(FILE_ERROR_KEYS.objectNotUploaded);
    expect(
      mapFileError({
        kind: "api",
        code: "INTERNAL_ERROR",
        message: "AccessDenied: stack trace",
      }),
    ).toBe(FILE_ERROR_KEYS.unexpected);
  });

  test("does not surface AWS or storage details from Axios errors", () => {
    const error = toFileClientError(
      new axios.AxiosError(
        "Request failed with status code 403",
        "ERR_BAD_REQUEST",
        {
          url: "https://storage.example.test/object",
          method: "put",
        },
        undefined,
        {
          status: 403,
          statusText: "Forbidden",
          headers: {},
          config: { url: "https://storage.example.test/object" },
          data: "<Error><Code>AccessDenied</Code></Error>",
        } as never,
      ),
    );

    expect(error.message).toBeUndefined();
    expect(error.kind).toBe("storage");
    expect(mapFileError(error)).toBe(FILE_ERROR_KEYS.expiredUpload);
    expect(JSON.stringify(error)).not.toContain("AccessDenied");
    expect(JSON.stringify(error)).not.toContain("secret-key");
  });

  test("maps delete failures to safe keys", () => {
    expect(
      mapFileError({ kind: "api", code: "UNAUTHORIZED", status: 401 }),
    ).toBe(FILE_ERROR_KEYS.unauthorized);
    expect(mapFileError({ kind: "api", code: "NOT_FOUND", status: 404 })).toBe(
      FILE_ERROR_KEYS.fileNotFound,
    );
    expect(
      mapFileError({ kind: "api", code: "RATE_LIMITED", status: 429 }),
    ).toBe(FILE_ERROR_KEYS.rateLimited);
    expect(mapFileError({ kind: "network", status: 0 })).toBe(
      FILE_ERROR_KEYS.networkFailure,
    );
  });

  test("maps storage and network failures", () => {
    expect(mapUnknownUploadError(new StorageUploadError("network"))).toBe(
      FILE_ERROR_KEYS.networkFailure,
    );
    expect(mapUnknownUploadError(new StorageUploadError("expired", 403))).toBe(
      FILE_ERROR_KEYS.expiredUpload,
    );
    expect(
      mapFileError({
        kind: "api",
        code: "RATE_LIMITED",
        status: 429,
      }),
    ).toBe(FILE_ERROR_KEYS.rateLimited);
  });
});
