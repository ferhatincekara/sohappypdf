import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import {
  assertPolarCheckoutConfig,
  loadBillingConfig,
} from "./billing-config.js";

describe("loadBillingConfig", () => {
  test("allows Polar to be omitted so local and CI can run without billing", () => {
    const config = loadBillingConfig({});

    expect(config.polar.accessToken).toBeUndefined();
    expect(config.polar.server).toBe("sandbox");
    expect(config.successPath).toBe("/account/billing");
    expect(config.appUrl).toBe("http://localhost:3000");
  });

  test("reads Polar identifiers from environment configuration", () => {
    const config = loadBillingConfig({
      POLAR_ACCESS_TOKEN: "polar_at_test",
      POLAR_WEBHOOK_SECRET: "whsec_test",
      POLAR_PRO_PRODUCT_ID: "prod_pro",
      POLAR_SERVER: "production",
    });

    expect(config.polar).toEqual({
      accessToken: "polar_at_test",
      webhookSecret: "whsec_test",
      proProductId: "prod_pro",
      proYearlyProductId: undefined,
      apiStarterProductId: undefined,
      apiStarterYearlyProductId: undefined,
      apiGrowthProductId: undefined,
      apiGrowthYearlyProductId: undefined,
      apiScaleProductId: undefined,
      apiScaleYearlyProductId: undefined,
      server: "production",
    });
  });

  test("does not treat Polar product IDs as internal plans", () => {
    const config = loadBillingConfig({
      POLAR_ACCESS_TOKEN: "polar_at_test",
      POLAR_PRO_PRODUCT_ID: "prod_pro",
    });

    expect(assertPolarCheckoutConfig(config.polar).proProductId).toBe(
      "prod_pro",
    );
    expect(config.polar.proProductId).not.toBe("pro");
  });

  test("rejects an invalid Polar server", () => {
    try {
      loadBillingConfig({ POLAR_SERVER: "stripe" });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
