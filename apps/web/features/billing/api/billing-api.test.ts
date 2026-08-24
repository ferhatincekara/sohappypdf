import { describe, expect, test } from "bun:test";
import type { AxiosInstance } from "axios";
import { BillingApiRequestError, createBillingApi } from "./billing-api";

function createClient(overrides: {
  get?: AxiosInstance["get"];
  post?: AxiosInstance["post"];
}): AxiosInstance {
  return {
    get: overrides.get,
    post: overrides.post,
  } as AxiosInstance;
}

describe("billing api", () => {
  test("loads billing status without Polar secrets", async () => {
    const api = createBillingApi(
      createClient({
        get: (async (url) => {
          expect(url).toBe("/api/v1/billing");
          return {
            data: {
              billing: {
                plan: "free",
                subscriptionStatus: null,
                cancelAtPeriodEnd: false,
                currentPeriodEnd: null,
                canUpgrade: true,
                canManage: false,
                usage: {
                  webCreditsUsed: 0,
                  webCreditsLimit: 100,
                  conversionsUsed: 0,
                  conversionsLimit: 20,
                  storageUsedBytes: 0,
                  storageLimitBytes: 500,
                  apiKeyCount: 0,
                  apiKeyLimit: 2,
                  periodStart: "2026-08-01T00:00:00.000Z",
                  periodEnd: "2026-09-01T00:00:00.000Z",
                },
                limits: {
                  maxFileSizeBytes: 20,
                  apiAccess: true,
                },
              },
            },
          };
        }) as AxiosInstance["get"],
      }),
    );

    const result = await api.getStatus();
    expect(result.billing.plan).toBe("free");
    expect(JSON.stringify(result).includes("polar")).toBe(false);
  });

  test("wraps checkout failures", async () => {
    const api = createBillingApi(
      createClient({
        post: (async () => {
          throw new Error("network");
        }) as AxiosInstance["post"],
      }),
    );

    try {
      await api.createCheckout();
      throw new Error("expected checkout to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BillingApiRequestError);
    }
  });
});
