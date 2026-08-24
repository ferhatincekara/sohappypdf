import { describe, expect, test } from "bun:test";
import { parsePolarSubscription } from "./polar-subscription.js";

describe("parsePolarSubscription", () => {
  test("reads Polar customer-state fields including endsAt", () => {
    const parsed = parsePolarSubscription({
      id: "sub_1",
      status: "active",
      productId: "prod_pro",
      customerId: "cus_1",
      externalCustomerId: "user_1",
      cancelAtPeriodEnd: false,
      currentPeriodStart: "2026-08-01T00:00:00.000Z",
      currentPeriodEnd: "2026-09-01T00:00:00.000Z",
      endsAt: "2026-09-01T00:00:00.000Z",
    });

    expect(parsed?.polarSubscriptionId).toBe("sub_1");
    expect(parsed?.polarProductId).toBe("prod_pro");
    expect(parsed?.endedAt?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});
