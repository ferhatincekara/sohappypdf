import { describe, expect, test } from "bun:test";
import type { PublicBillingStatus } from "../types/billing";
import {
  apiProductLabelKey,
  apiSubscribeProducts,
  canOpenBillingDashboard,
  hasAiBilling,
  listBillingCenterSections,
  resolveBillingCenterFlags,
  resolveBillingCenterSection,
  webCreditsResetDate,
  webPlanRenewalDate,
} from "./billing-view";

const periodStart = "2026-08-01T00:00:00.000Z";
const periodEnd = "2026-09-01T00:00:00.000Z";

function createBilling(
  overrides: Partial<PublicBillingStatus> & {
    usage?: Partial<PublicBillingStatus["usage"]>;
    api?: Partial<PublicBillingStatus["api"]>;
  } = {},
): PublicBillingStatus {
  return {
    plan: "free",
    subscriptionStatus: null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    canUpgrade: true,
    canManage: false,
    ...overrides,
    usage: {
      webCreditsUsed: 12,
      webCreditsLimit: 100,
      webCreditsRemaining: 88,
      aiCreditsUsed: 0,
      aiCreditsLimit: 0,
      aiCreditsRemaining: 0,
      conversionsUsed: 3,
      conversionsLimit: 20,
      storageUsedBytes: 1024,
      storageLimitBytes: 500,
      apiKeyCount: 0,
      apiKeyLimit: 2,
      periodStart,
      periodEnd,
      ...overrides.usage,
    },
    api: {
      product: null,
      subscriptionStatus: null,
      creditsUsed: 0,
      creditsLimit: 0,
      creditsRemaining: 0,
      recentUsage: [],
      canSubscribe: true,
      canTopUp: true,
      availableProducts: ["api-starter", "api-growth", "api-scale", "api-pack"],
      periodStart,
      periodEnd,
      ...overrides.api,
    },
    limits: {
      maxFileSizeBytes: 20,
      apiAccess: true,
      ...overrides.limits,
    },
  };
}

const freeBilling = createBilling();

const proBilling = createBilling({
  plan: "pro",
  subscriptionStatus: "active",
  currentPeriodEnd: "2026-09-15T12:00:00.000Z",
  canUpgrade: false,
  canManage: true,
  usage: {
    webCreditsUsed: 40,
    webCreditsLimit: 2_000,
    webCreditsRemaining: 1_960,
    aiCreditsUsed: 0,
    aiCreditsLimit: 200,
    aiCreditsRemaining: 200,
  },
});

const apiBilling = createBilling({
  canManage: true,
  api: {
    product: "starter",
    subscriptionStatus: "active",
    creditsUsed: 25,
    creditsLimit: 1_000,
    creditsRemaining: 975,
    canSubscribe: true,
    canTopUp: true,
  },
});

const aiBilling = createBilling({
  plan: "pro",
  subscriptionStatus: "active",
  currentPeriodEnd: "2026-09-15T12:00:00.000Z",
  canUpgrade: false,
  canManage: true,
  usage: {
    webCreditsUsed: 40,
    webCreditsLimit: 2_000,
    webCreditsRemaining: 1_960,
    aiCreditsUsed: 10,
    aiCreditsLimit: 200,
    aiCreditsRemaining: 190,
  },
});

describe("billing dashboard access", () => {
  test("anonymous users cannot open the billing dashboard", () => {
    expect(canOpenBillingDashboard(false)).toBe(false);
    expect(
      resolveBillingCenterFlags({
        isAuthenticated: false,
        billing: null,
      }),
    ).toEqual({
      canOpenDashboard: false,
      isFree: false,
      isPro: false,
      hasApiPlan: false,
      hasAi: false,
    });
  });

  test("signed-in users can open the billing dashboard", () => {
    expect(canOpenBillingDashboard(true)).toBe(true);
  });
});

describe("billing center sections", () => {
  test("free users see remaining credits, limits, and an upgrade path", () => {
    const flags = resolveBillingCenterFlags({
      isAuthenticated: true,
      billing: freeBilling,
    });

    expect(flags).toEqual({
      canOpenDashboard: true,
      isFree: true,
      isPro: false,
      hasApiPlan: false,
      hasAi: false,
    });
    expect(listBillingCenterSections(freeBilling)).toEqual(["web", "api"]);
    expect(hasAiBilling(freeBilling.usage)).toBe(false);
    expect(freeBilling.canUpgrade).toBe(true);
    expect(freeBilling.usage.webCreditsRemaining).toBe(88);
    expect(freeBilling.usage.webCreditsLimit).toBe(100);
    expect(webPlanRenewalDate(freeBilling)).toBeNull();
    expect(webCreditsResetDate(freeBilling)).toBe("2026-09-01");
  });

  test("pro users see web credits, renewal, and Polar portal management", () => {
    const flags = resolveBillingCenterFlags({
      isAuthenticated: true,
      billing: proBilling,
    });

    expect(flags.isPro).toBe(true);
    expect(flags.isFree).toBe(false);
    expect(proBilling.canUpgrade).toBe(false);
    expect(proBilling.canManage).toBe(true);
    expect(webPlanRenewalDate(proBilling)).toBe("2026-09-15");
    expect(proBilling.usage.webCreditsRemaining).toBe(1_960);
    expect(proBilling.usage.webCreditsLimit).toBe(2_000);
  });

  test("API users see remaining API credits, plan, and top-up products", () => {
    const flags = resolveBillingCenterFlags({
      isAuthenticated: true,
      billing: apiBilling,
    });

    expect(flags.hasApiPlan).toBe(true);
    expect(listBillingCenterSections(apiBilling)).toEqual(["web", "api"]);
    expect(apiBilling.api.product).toBe("starter");
    expect(apiBilling.api.creditsRemaining).toBe(975);
    expect(apiBilling.api.creditsLimit).toBe(1_000);
    expect(apiBilling.api.canTopUp).toBe(true);
    expect(apiSubscribeProducts(apiBilling.api.availableProducts)).toEqual([
      "api-starter",
      "api-growth",
      "api-scale",
    ]);
    expect(apiProductLabelKey("api-starter")).toBe("starter");
  });

  test("AI users see the AI section with remaining AI credits", () => {
    const flags = resolveBillingCenterFlags({
      isAuthenticated: true,
      billing: aiBilling,
    });

    expect(flags.hasAi).toBe(true);
    expect(flags.isPro).toBe(true);
    expect(hasAiBilling(aiBilling.usage)).toBe(true);
    expect(listBillingCenterSections(aiBilling)).toEqual(["web", "api", "ai"]);
    expect(aiBilling.usage.aiCreditsRemaining).toBe(190);
    expect(aiBilling.usage.aiCreditsLimit).toBe(200);
    expect(aiBilling.usage.aiCreditsUsed).toBe(10);
  });

  test("hides the AI section when the account has no AI credits", () => {
    expect(resolveBillingCenterSection("ai", ["web", "api"])).toBe("web");
  });
});
