import { describe, expect, test } from "bun:test";
import axios, { type AxiosInstance } from "axios";
import type { PublicConversion } from "../types/conversion";
import {
  ConversionApiRequestError,
  createConversionApi,
} from "./conversion-api";

function createConversion(): PublicConversion {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    status: "queued",
    sourceFileId: "11111111-1111-4111-8111-111111111111",
    sourceFilename: "report.pdf",
    outputFileId: null,
    type: "pdf-to-jpg",
    sourceFormat: "pdf",
    targetFormat: "jpg",
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    queuedAt: "2026-08-24T00:00:01.000Z",
    startedAt: null,
    completedAt: null,
    expiresAt: "2026-08-24T02:00:00.000Z",
    expired: false,
  };
}

function createClient(overrides: {
  post?: AxiosInstance["post"];
  get?: AxiosInstance["get"];
}): AxiosInstance {
  return {
    post: overrides.post,
    get: overrides.get,
  } as AxiosInstance;
}

describe("conversion api", () => {
  test("creates a conversion through the existing API contract", async () => {
    const received: unknown[] = [];
    const api = createConversionApi(
      createClient({
        post: (async (url, body, config) => {
          received.push({ url, body, headers: config?.headers });
          return { data: { conversion: createConversion() } };
        }) as AxiosInstance["post"],
      }),
    );

    const conversion = await api.create({
      sourceFileId: "11111111-1111-4111-8111-111111111111",
      targetFormat: "jpg",
      idempotencyKey: "idem-1",
    });

    expect(conversion.status).toBe("queued");
    expect(received).toEqual([
      {
        url: "/v1/conversions",
        body: {
          sourceFileId: "11111111-1111-4111-8111-111111111111",
          targetFormat: "jpg",
        },
        headers: { "Idempotency-Key": "idem-1" },
      },
    ]);
  });

  test("loads a conversion by the route id", async () => {
    const api = createConversionApi(
      createClient({
        get: (async (url) => {
          expect(url).toBe(
            "/v1/conversions/22222222-2222-4222-8222-222222222222",
          );
          return { data: { conversion: createConversion() } };
        }) as AxiosInstance["get"],
      }),
    );

    const conversion = await api.get("22222222-2222-4222-8222-222222222222");
    expect(conversion.id).toBe("22222222-2222-4222-8222-222222222222");
  });

  test("lists conversions with status and cursor query params", async () => {
    const received: unknown[] = [];
    const api = createConversionApi(
      createClient({
        get: (async (url, config) => {
          received.push({ url, params: config?.params });
          return {
            data: {
              conversions: [createConversion()],
              nextCursor: null,
            },
          };
        }) as AxiosInstance["get"],
      }),
    );

    const result = await api.list({ status: "completed", cursor: "next-1" });

    expect(result.conversions).toHaveLength(1);
    expect(received).toEqual([
      {
        url: "/v1/conversions",
        params: { cursor: "next-1", status: "completed" },
      },
    ]);
  });

  test("wraps API errors without leaking internals", async () => {
    const api = createConversionApi(
      createClient({
        post: (async () => {
          throw new axios.AxiosError(
            "Request failed",
            "ERR_BAD_REQUEST",
            undefined,
            undefined,
            {
              status: 400,
              data: {
                error: {
                  code: "VALIDATION_ERROR",
                  message: "Unsupported conversion",
                },
              },
            } as never,
          );
        }) as AxiosInstance["post"],
      }),
    );

    try {
      await api.create({
        sourceFileId: "11111111-1111-4111-8111-111111111111",
        targetFormat: "xlsx",
      });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ConversionApiRequestError);
      if (error instanceof ConversionApiRequestError) {
        expect(error.clientError.code).toBe("VALIDATION_ERROR");
        expect(error.message).toBe("Conversion request failed");
      }
    }
  });
});
