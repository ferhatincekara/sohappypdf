import { describe, expect, test } from "bun:test";
import type { PolarConfig } from "@sohappypdf/config";
import {
  apiProductKeyFromPolarProductId,
  isApiCheckoutProductKey,
  isCheckoutProductKey,
  isWebProPolarProduct,
  listConfiguredCheckoutProducts,
  monthlyApiCreditsForProduct,
  polarCheckoutProductIds,
  polarProductIdForCheckout,
  polarProductIdForSubscriptionUpdate,
} from "./polar-products.js";

const polar: PolarConfig = {
  accessToken: "token",
  webhookSecret: "secret",
  proProductId: "prod_pro",
  proYearlyProductId: "prod_pro_yearly",
  apiStarterProductId: "prod_starter",
  apiStarterYearlyProductId: "prod_starter_yearly",
  apiGrowthProductId: "prod_growth",
  apiGrowthYearlyProductId: "prod_growth_yearly",
  apiScaleProductId: "prod_scale",
  apiScaleYearlyProductId: "prod_scale_yearly",
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
    expect(apiProductKeyFromPolarProductId("prod_starter_yearly", polar)).toBe(
      "starter",
    );
    expect(polarCheckoutProductIds("api-starter", polar)).toEqual([
      "prod_starter",
    ]);
    expect(polarCheckoutProductIds("api-starter", polar, "yearly")).toEqual([
      "prod_starter_yearly",
    ]);
    expect(
      polarProductIdForSubscriptionUpdate(
        "api-growth",
        "prod_starter_yearly",
        polar,
      ),
    ).toBe("prod_growth_yearly");
    expect(isWebProPolarProduct("prod_pro_yearly", polar)).toBe(true);
    expect(
      polarCheckoutProductIds(
        "api-starter",
        { ...polar, apiStarterYearlyProductId: undefined },
        "yearly",
      ),
    ).toEqual(["prod_starter"]);
    expect(polarProductIdForCheckout("api-starter", polar)).toBe(
      "prod_starter",
    );
    expect(isCheckoutProductKey("api-starter")).toBe(true);
    expect(isCheckoutProductKey("prod_starter")).toBe(false);
    expect(isCheckoutProductKey("api-pack")).toBe(false);
    expect(isApiCheckoutProductKey("api-growth")).toBe(true);
    expect(isApiCheckoutProductKey("pro")).toBe(false);
  });

  test("lists only configured checkout products", () => {
    expect(listConfiguredCheckoutProducts(polar)).toEqual([
      "pro",
      "api-starter",
      "api-growth",
      "api-scale",
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
