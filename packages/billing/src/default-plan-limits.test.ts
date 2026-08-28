import { describe, expect, test } from "bun:test";
import {
  API_PACK_MONTHLY_PRICE_USD,
  API_PACK_YEARLY_DISCOUNT_PERCENT,
  apiPackYearlyPriceUsd,
  DEFAULT_API_CREDIT_PACKS,
  DEFAULT_PLAN_LIMITS,
  fallbackCatalogPrices,
  formatUsdAmount,
  INCLUDED_API_CREDITS_PER_MONTH,
  includedApiCreditBalance,
  PLAN_IDS,
  PRO_MAX_FILES_PER_OPERATION,
  resolveWebMaxFilesPerOperation,
  WEB_PLAN_MONTHLY_PRICE_USD,
} from "./default-plan-limits.js";
import { DEFAULT_PLAN_LIMITS as typedCatalog } from "./plan-config.js";
import { PLANS } from "./plan-types.js";

describe("default plan limits", () => {
  test("keeps the leaf catalog aligned with the typed billing catalog", () => {
    expect([...PLAN_IDS]).toEqual([...PLANS]);
    expect(typedCatalog).toEqual(DEFAULT_PLAN_LIMITS);
  });

  test("caps leftover pack grants to the included monthly API credits", () => {
    expect(INCLUDED_API_CREDITS_PER_MONTH).toBe(100);
    expect(
      includedApiCreditBalance({
        apiCreditsGranted: 100_000,
        apiCreditsUsed: 0,
      }),
    ).toEqual({
      apiCreditsGranted: 100,
      apiCreditsUsed: 0,
      apiCreditsRemaining: 100,
    });
    expect(
      includedApiCreditBalance({
        apiCreditsGranted: 100,
        apiCreditsUsed: 12,
      }),
    ).toEqual({
      apiCreditsGranted: 100,
      apiCreditsUsed: 12,
      apiCreditsRemaining: 88,
    });
  });

  test("publishes the Pro web list price as five US dollars per month", () => {
    expect(WEB_PLAN_MONTHLY_PRICE_USD.free).toBe(0);
    expect(WEB_PLAN_MONTHLY_PRICE_USD.pro).toBe(5);
  });

  test("publishes Developer API pack list prices with a yearly discount", () => {
    expect(DEFAULT_API_CREDIT_PACKS.starter).toBe(2_000);
    expect(API_PACK_MONTHLY_PRICE_USD.starter).toBe(9);
    expect(API_PACK_MONTHLY_PRICE_USD.growth).toBe(29);
    expect(API_PACK_MONTHLY_PRICE_USD.scale).toBe(99);
    expect(API_PACK_YEARLY_DISCOUNT_PERCENT).toBe(20);
    expect(apiPackYearlyPriceUsd(9)).toBe(86);
    expect(apiPackYearlyPriceUsd(29)).toBe(278);
    expect(apiPackYearlyPriceUsd(99)).toBe(950);
  });

  test("falls back to those list prices when Polar is unavailable", () => {
    const prices = fallbackCatalogPrices();

    expect(prices.pro.monthlyUsd).toBe(WEB_PLAN_MONTHLY_PRICE_USD.pro);
    expect(prices.pro.yearlyUsd).toBeNull();
    expect(prices.starter.monthlyUsd).toBe(API_PACK_MONTHLY_PRICE_USD.starter);
    expect(prices.starter.yearlyUsd).toBe(86);
  });

  test("formats catalog USD amounts without trailing zeros", () => {
    expect(formatUsdAmount(5)).toBe("$5");
    expect(formatUsdAmount(12)).toBe("$12");
    expect(formatUsdAmount(8.99)).toBe("$8.99");
  });

  test("keeps combiner tools at their input count and Pro batch at 20", () => {
    expect(
      resolveWebMaxFilesPerOperation({
        isAuthenticated: false,
        toolMaxInputCount: 21,
        combinesSourceFiles: true,
      }),
    ).toBe(21);
    expect(
      resolveWebMaxFilesPerOperation({
        isAuthenticated: false,
        toolMaxInputCount: 1,
        supportsBatch: true,
      }),
    ).toBe(1);
    expect(
      resolveWebMaxFilesPerOperation({
        isAuthenticated: true,
        toolMaxInputCount: 1,
        planMaxFilesPerOperation: null,
        supportsBatch: true,
      }),
    ).toBe(PRO_MAX_FILES_PER_OPERATION);
  });
});
