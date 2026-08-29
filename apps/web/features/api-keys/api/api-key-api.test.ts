import { describe, expect, test } from "bun:test";
import axios, { type AxiosInstance } from "axios";
import type { PublicApiKey } from "../types/api-key";
import { ApiKeyApiRequestError, createApiKeyApi } from "./api-key-api";

function createApiKey(overrides: Partial<PublicApiKey> = {}): PublicApiKey {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Production",
    keyPrefix: "shpdf_abcd1234",
    status: "active",
    createdAt: "2026-08-24T00:00:00.000Z",
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

function createClient(overrides: {
  get?: AxiosInstance["get"];
  post?: AxiosInstance["post"];
  delete?: AxiosInstance["delete"];
}): AxiosInstance {
  return {
    get: overrides.get,
    post: overrides.post,
    delete: overrides.delete,
  } as AxiosInstance;
}

describe("api key api", () => {
  test("lists metadata without a raw secret", async () => {
    const api = createApiKeyApi(
      createClient({
        get: (async (url) => {
          expect(url).toBe("/v1/api-keys");
          return { data: { apiKeys: [createApiKey()] } };
        }) as AxiosInstance["get"],
      }),
    );

    const result = await api.list();

    expect(result.apiKeys).toHaveLength(1);
    expect(result.apiKeys[0]).not.toHaveProperty("secret");
  });

  test("creates a key and returns the one-time secret to the caller only", async () => {
    const secret = "shpdf_abcd1234_test-secret-not-for-production";
    const api = createApiKeyApi(
      createClient({
        post: (async (url, body) => {
          expect(url).toBe("/v1/api-keys");
          expect(body).toEqual({ name: "Production" });
          return {
            data: {
              apiKey: createApiKey(),
              secret,
            },
          };
        }) as AxiosInstance["post"],
      }),
    );

    const created = await api.create({ name: "Production" });

    expect(created.secret).toBe(secret);
    expect(created.apiKey).not.toHaveProperty("secret");
  });

  test("revokes through the API and maps failures without leaking internals", async () => {
    const api = createApiKeyApi(
      createClient({
        delete: (async () => {
          throw new axios.AxiosError(
            "Request failed",
            "ERR_BAD_REQUEST",
            undefined,
            undefined,
            {
              status: 429,
              data: {
                error: {
                  code: "RATE_LIMITED",
                  message: "Upstash limit exceeded",
                },
              },
            } as never,
          );
        }) as AxiosInstance["delete"],
      }),
    );

    try {
      await api.revoke("11111111-1111-4111-8111-111111111111");
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiKeyApiRequestError);
      if (error instanceof ApiKeyApiRequestError) {
        expect(error.clientError.code).toBe("RATE_LIMITED");
        expect(error.message).toBe("API key request failed");
        expect(error.message).not.toContain("Upstash");
      }
    }
  });
});
