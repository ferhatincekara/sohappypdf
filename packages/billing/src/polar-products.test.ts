import { describe, expect, test } from "bun:test";
import type { PolarConfig } from "@repo/config";
import {
  apiProductKeyFromPolarProductId,
  isCheckoutProductKey,
  listConfiguredCheckoutProducts,
  monthlyApiCreditsForProduct,
  packCreditsForPolarProduct,
  polarProductIdForCheckout,
} from "./polar-products.js";

const polar: PolarConfig = {
  accessToken: "token",
  webhookSecret: "secret",
  proProductId: "prod_pro",
  apiStarterProductId: "prod_starter",
  apiGrowthProductId: "prod_growth",
  apiScaleProductId: "prod_scale",
  apiCreditPacks: [{ productId: "prod_pack", credits: 500 }],
  server: "sandbox",
};

describe("polar products", () => {
  test("maps Polar IDs to API product keys without exposing them as checkout keys", () => {
    expect(apiProductKeyFromPolarProductId("prod_starter", polar)).toBe(
      "starter",
    );
    expect(apiProductKeyFromPolarProductId("prod_growth", polar)).toBe(
      "growth",
    );
    expect(packCreditsForPolarProduct("prod_pack", polar)).toBe(500);
    expect(polarProductIdForCheckout("api-starter", polar)).toBe(
      "prod_starter",
    );
    expect(isCheckoutProductKey("api-starter")).toBe(true);
    expect(isCheckoutProductKey("prod_starter")).toBe(false);
  });

  test("lists only configured checkout products", () => {
    expect(listConfiguredCheckoutProducts(polar)).toEqual([
      "pro",
      "api-starter",
      "api-growth",
      "api-scale",
      "api-pack",
    ]);
    expect(
      monthlyApiCreditsForProduct("starter", {
        starterMonthlyCredits: 10,
        growthMonthlyCredits: 20,
        scaleMonthlyCredits: 30,
      }),
    ).toBe(10);
  });
});
