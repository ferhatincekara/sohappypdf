import { describe, expect, test } from "bun:test";
import {
  DEFAULT_API_GROWTH_CREDITS,
  DEFAULT_API_SCALE_CREDITS,
  DEFAULT_API_STARTER_CREDITS,
  loadApiCreditConfig,
} from "./api-credit-config.js";

describe("loadApiCreditConfig", () => {
  test("uses defaults when env is unset", () => {
    expect(DEFAULT_API_STARTER_CREDITS).toBe(2_000);
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
