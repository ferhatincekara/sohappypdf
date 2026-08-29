import { describe, expect, test } from "bun:test";
import type { AxiosInstance } from "axios";
import {
  BillingApiRequestError,
  createBillingApi,
} from "@/features/billing/api/billing-api";

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
          expect(url).toBe("/v1/billing");
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
                  webCreditsRemaining: 100,
                  aiCreditsUsed: 0,
                  aiCreditsLimit: 0,
                  aiCreditsRemaining: 0,
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
                  maxFilesPerOperation: 1,
                  maxPagesPerFile: 50,
                  apiAccess: true,
                  apiRequestsPerMinute: 30,
                },
                api: {
                  product: null,
                  subscriptionStatus: null,
                  creditsUsed: 0,
                  creditsLimit: 0,
                  creditsRemaining: 0,
                  recentUsage: [],
                  canSubscribe: false,
                  availableProducts: [],
                  periodStart: "2026-08-01T00:00:00.000Z",
                  periodEnd: "2026-09-01T00:00:00.000Z",
                },
                prices: {
                  pro: { monthlyUsd: 5, yearlyUsd: null },
                  starter: { monthlyUsd: 9, yearlyUsd: 86 },
                  growth: { monthlyUsd: 29, yearlyUsd: 278 },
                  scale: { monthlyUsd: 99, yearlyUsd: 950 },
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

  test("posts the selected checkout interval", async () => {
    const api = createBillingApi(
      createClient({
        post: (async (url, body) => {
          expect(url).toBe("/v1/billing/checkout");
          expect(body).toEqual({
            product: "api-starter",
            interval: "yearly",
          });
          return { data: { checkout: { url: "https://polar.example/c" } } };
        }) as AxiosInstance["post"],
      }),
    );

    const result = await api.createCheckout("api-starter", "yearly");
    expect(result.checkout.url).toBe("https://polar.example/c");
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

  test("wraps portal failures", async () => {
    const api = createBillingApi(
      createClient({
        post: (async () => {
          throw new Error("network");
        }) as AxiosInstance["post"],
      }),
    );

    try {
      await api.createPortal();
      throw new Error("expected portal to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BillingApiRequestError);
    }
  });
});
