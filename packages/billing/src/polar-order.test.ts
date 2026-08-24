import { describe, expect, test } from "bun:test";
import type { PolarConfig } from "@repo/config";
import { apiPackCreditsFromOrder, parsePolarOrder } from "./polar-order.js";

const polar: PolarConfig = {
  accessToken: "token",
  webhookSecret: "secret",
  proProductId: "prod_pro",
  apiStarterProductId: "prod_starter",
  apiGrowthProductId: undefined,
  apiScaleProductId: undefined,
  apiCreditPacks: [{ productId: "prod_pack", credits: 500 }],
  server: "sandbox",
};

describe("parsePolarOrder", () => {
  test("reads paid pack credits and ignores recurring API products", () => {
    const order = parsePolarOrder({
      id: "ord_1",
      status: "paid",
      externalCustomerId: "user_1",
      customerId: "cus_1",
      items: [{ productId: "prod_pack" }, { productId: "prod_starter" }],
    });

    expect(order).toBeDefined();
    if (order === undefined) {
      throw new Error("expected order");
    }
    expect(order.paid).toBe(true);
    expect(order.externalUserId).toBe("user_1");
    expect(apiPackCreditsFromOrder(order, polar)).toBe(500);
  });
});
