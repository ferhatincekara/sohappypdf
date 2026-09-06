import { describe, expect, test } from "bun:test";
import { fallbackCatalogPrices } from "@sohappypdf/billing/plans";
import {
  apiPackCheckoutAction,
  apiPackRenewalDate,
  apiProductLabelKey,
  apiSubscribeProducts,
  billingHeroInterval,
  canOpenApiPolarPortal,
  canOpenBillingDashboard,
  canOpenWebPolarPortal,
  catalogPriceForCycle,
  formatUsdAmount,
  isSelectedApiOfferPack,
  listBillingCenterSections,
  parseBillingCenterSection,
  resolveBillingCenterFlags,
  resolveBillingCenterSection,
  resolveBillingPlanNotice,
  shouldShowBillingCycleToggle,
  subscribedBillingInterval,
  webCreditsResetDate,
  webPlanCheckoutAction,
  webPlanRenewalDate,
} from "@/features/billing/lib/billing-view";
import type { PublicBillingStatus } from "@/features/billing/types/billing";

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
    interval: null,
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
      interval: null,
      subscriptionStatus: null,
      creditsUsed: 0,
      creditsLimit: 0,
      creditsRemaining: 0,
      recentUsage: [],
      canSubscribe: true,
      availableProducts: ["api-starter", "api-growth", "api-scale"],
      periodStart,
      periodEnd,
      ...overrides.api,
    },
    limits: {
      maxFileSizeBytes: 20,
      maxFilesPerOperation: 1,
      maxPagesPerFile: 50,
      apiAccess: true,
      apiRequestsPerMinute: 30,
      ...overrides.limits,
    },
    prices: overrides.prices ?? fallbackCatalogPrices(),
  };
}

const freeBilling = createBilling();

const proBilling = createBilling({
  plan: "pro",
  subscriptionStatus: "active",
  currentPeriodEnd: "2026-09-15T12:00:00.000Z",
  canUpgrade: false,
  canManage: true,
  interval: "monthly",
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
    interval: "monthly",
    subscriptionStatus: "active",
    creditsUsed: 25,
    creditsLimit: 2_000,
    creditsRemaining: 1_975,
    canSubscribe: true,
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
    });
    expect(listBillingCenterSections()).toEqual(["web", "api"]);
    expect(freeBilling.canUpgrade).toBe(true);
    expect(freeBilling.usage.webCreditsRemaining).toBe(88);
    expect(freeBilling.usage.webCreditsLimit).toBe(100);
    expect(webPlanRenewalDate(freeBilling)).toBeNull();
    expect(webCreditsResetDate(freeBilling)).toBe("2026-09-01T00:00:00.000Z");
    expect(canOpenWebPolarPortal(freeBilling)).toBe(false);
    expect(canOpenApiPolarPortal(freeBilling.api)).toBe(false);
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
    expect(canOpenWebPolarPortal(proBilling)).toBe(true);
    expect(webPlanRenewalDate(proBilling)).toBe("2026-09-15T12:00:00.000Z");
    expect(proBilling.usage.webCreditsRemaining).toBe(1_960);
    expect(proBilling.usage.webCreditsLimit).toBe(2_000);
  });

  test("API users see remaining API credits and subscribe products", () => {
    const flags = resolveBillingCenterFlags({
      isAuthenticated: true,
      billing: apiBilling,
    });

    expect(flags.hasApiPlan).toBe(true);
    expect(canOpenWebPolarPortal(apiBilling)).toBe(false);
    expect(canOpenApiPolarPortal(apiBilling.api)).toBe(true);
    expect(listBillingCenterSections()).toEqual(["web", "api"]);
    expect(apiBilling.api.product).toBe("starter");
    expect(apiBilling.api.creditsRemaining).toBe(1_975);
    expect(apiBilling.api.creditsLimit).toBe(2_000);
    expect(apiSubscribeProducts(apiBilling.api.availableProducts)).toEqual([
      "api-starter",
      "api-growth",
      "api-scale",
    ]);
    expect(apiSubscribeProducts([])).toEqual([]);
    expect(apiProductLabelKey("api-starter")).toBe("starter");
    expect(apiPackCheckoutAction(null, "api-starter")).toBe("subscribe");
    expect(apiPackCheckoutAction("starter", "api-starter")).toBe("current");
    expect(
      isSelectedApiOfferPack("starter", "api-starter", "monthly", "yearly"),
    ).toBe(false);
    expect(
      isSelectedApiOfferPack("starter", "api-starter", "monthly", "monthly"),
    ).toBe(true);
    expect(
      isSelectedApiOfferPack("starter", "api-growth", "monthly", "monthly"),
    ).toBe(false);
    expect(apiPackCheckoutAction("starter", "api-growth")).toBe("switch");
  });

  test("does not surface AI credits in the billing center", () => {
    const flags = resolveBillingCenterFlags({
      isAuthenticated: true,
      billing: aiBilling,
    });

    expect(flags.isPro).toBe(true);
    expect(listBillingCenterSections()).toEqual(["web", "api"]);
    expect(resolveBillingCenterSection("web", ["web", "api"])).toBe("web");
    expect(resolveBillingCenterSection("api", ["web"])).toBe("web");
    expect(resolveBillingCenterSection("unknown", ["web", "api"])).toBe("web");
    expect(parseBillingCenterSection("api")).toBe("api");
    expect(parseBillingCenterSection(null)).toBe("web");
  });

  test("describes free plans as included, not as missing subscriptions", () => {
    expect(
      resolveBillingPlanNotice({
        paid: false,
        cancelAtPeriodEnd: false,
        periodEnd: null,
        subscriptionStatus: null,
      }),
    ).toEqual({ kind: "included" });
    expect(
      resolveBillingPlanNotice({
        paid: true,
        cancelAtPeriodEnd: false,
        periodEnd: "2026-09-15T12:00:00.000Z",
        subscriptionStatus: "active",
      }),
    ).toEqual({
      kind: "renews",
      date: "2026-09-15T12:00:00.000Z",
    });
    expect(apiPackRenewalDate(apiBilling.api)).toBe("2026-09-01T00:00:00.000Z");
    expect(apiPackRenewalDate(freeBilling.api)).toBeNull();
  });

  test("formats Polar catalog amounts without trailing zeros", () => {
    expect(formatUsdAmount(5)).toBe("$5");
    expect(formatUsdAmount(12)).toBe("$12");
    expect(formatUsdAmount(8.99)).toBe("$8.99");
    expect(
      catalogPriceForCycle({ monthlyUsd: 9, yearlyUsd: 86 }, "monthly"),
    ).toEqual({ amount: 9, interval: "monthly" });
    expect(
      catalogPriceForCycle({ monthlyUsd: 9, yearlyUsd: 86 }, "yearly"),
    ).toEqual({ amount: 86, interval: "yearly" });
    expect(
      catalogPriceForCycle({ monthlyUsd: 5, yearlyUsd: null }, "yearly"),
    ).toEqual({ amount: 5, interval: "monthly" });
    expect(
      shouldShowBillingCycleToggle({
        section: "web",
        billing: createBilling({
          prices: {
            pro: { monthlyUsd: 5, yearlyUsd: 48 },
            starter: { monthlyUsd: 9, yearlyUsd: 86 },
            growth: { monthlyUsd: 29, yearlyUsd: 278 },
            scale: { monthlyUsd: 99, yearlyUsd: 950 },
          },
        }),
      }),
    ).toBe(true);
    expect(
      shouldShowBillingCycleToggle({
        section: "web",
        billing: proBilling,
      }),
    ).toBe(false);
    expect(
      shouldShowBillingCycleToggle({
        section: "web",
        billing: createBilling({
          plan: "pro",
          canUpgrade: false,
          prices: {
            pro: { monthlyUsd: 5, yearlyUsd: 48 },
            starter: { monthlyUsd: 9, yearlyUsd: 86 },
            growth: { monthlyUsd: 29, yearlyUsd: 278 },
            scale: { monthlyUsd: 99, yearlyUsd: 950 },
          },
        }),
      }),
    ).toBe(true);
    expect(
      shouldShowBillingCycleToggle({
        section: "api",
        billing: apiBilling,
      }),
    ).toBe(true);
    expect(
      shouldShowBillingCycleToggle({
        section: "api",
        billing: freeBilling,
      }),
    ).toBe(true);
  });

  test("keeps Polar portal off the web plan until a web subscription exists", () => {
    expect(canOpenWebPolarPortal(freeBilling)).toBe(false);
    expect(canOpenWebPolarPortal(proBilling)).toBe(true);
    expect(
      canOpenWebPolarPortal({
        plan: "free",
        subscriptionStatus: "revoked",
      }),
    ).toBe(false);
    expect(canOpenApiPolarPortal(freeBilling.api)).toBe(false);
    expect(canOpenApiPolarPortal(apiBilling.api)).toBe(true);
    expect(webPlanCheckoutAction(freeBilling, "monthly")).toBe("upgrade");
    expect(webPlanCheckoutAction(proBilling, "monthly")).toBe("current");
    expect(webPlanCheckoutAction(proBilling, "yearly")).toBe("switch");
    expect(subscribedBillingInterval("web", proBilling)).toBe("monthly");
    expect(subscribedBillingInterval("api", apiBilling)).toBe("monthly");
    expect(
      billingHeroInterval({
        paid: true,
        subscribed: "monthly",
        selected: "yearly",
      }),
    ).toBe("monthly");
    expect(
      billingHeroInterval({
        paid: true,
        subscribed: "yearly",
        selected: "monthly",
      }),
    ).toBe("yearly");
    expect(
      billingHeroInterval({
        paid: false,
        subscribed: null,
        selected: "yearly",
      }),
    ).toBe("yearly");
  });
});
