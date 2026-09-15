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
    expect(parsed?.amountCents).toBeNull();
    expect(parsed?.recurringInterval).toBeNull();
  });

  test("stores Polar billed amount and treats a 100% coupon as $0", () => {
    expect(
      parsePolarSubscription({
        id: "sub_1",
        status: "active",
        productId: "prod_pro",
        amount: 0,
        recurringInterval: "month",
      })?.amountCents,
    ).toBe(0);
    expect(
      parsePolarSubscription({
        id: "sub_2",
        status: "active",
        productId: "prod_starter",
        amount: 900,
        recurring_interval: "month",
        discount: {
          type: "percentage",
          basisPoints: 10_000,
          duration: "forever",
        },
      }),
    ).toEqual(
      expect.objectContaining({
        amountCents: 0,
        recurringInterval: "month",
      }),
    );
  });
});
