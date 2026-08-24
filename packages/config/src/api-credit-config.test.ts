import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  DEFAULT_API_GROWTH_CREDITS,
  DEFAULT_API_SCALE_CREDITS,
  DEFAULT_API_STARTER_CREDITS,
  loadApiCreditConfig,
  parsePolarApiCreditPacks,
} from "./api-credit-config.js";

describe("loadApiCreditConfig", () => {
  test("uses defaults when env is unset", () => {
    expect(loadApiCreditConfig({})).toEqual({
      starterMonthlyCredits: DEFAULT_API_STARTER_CREDITS,
      growthMonthlyCredits: DEFAULT_API_GROWTH_CREDITS,
      scaleMonthlyCredits: DEFAULT_API_SCALE_CREDITS,
    });
  });

  test("reads configured values from env", () => {
    expect(
      loadApiCreditConfig({
        API_STARTER_CREDITS: "250",
        API_GROWTH_CREDITS: "2500",
        API_SCALE_CREDITS: "25000",
      }),
    ).toEqual({
      starterMonthlyCredits: 250,
      growthMonthlyCredits: 2500,
      scaleMonthlyCredits: 25000,
    });
  });
});

describe("parsePolarApiCreditPacks", () => {
  test("parses product id and credit amount pairs", () => {
    expect(parsePolarApiCreditPacks("prod_small:500,prod_large:5000")).toEqual([
      { productId: "prod_small", credits: 500 },
      { productId: "prod_large", credits: 5000 },
    ]);
  });

  test("rejects invalid pack configuration", () => {
    try {
      parsePolarApiCreditPacks("prod_small:nope");
      throw new Error("expected pack parsing to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
