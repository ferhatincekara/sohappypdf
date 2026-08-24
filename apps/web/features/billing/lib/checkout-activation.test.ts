import { describe, expect, test } from "bun:test";
import { isCheckoutActivationPending } from "./checkout-activation";

describe("isCheckoutActivationPending", () => {
  test("is pending only while checkout has not produced a subscription yet", () => {
    expect(
      isCheckoutActivationPending({
        plan: "free",
        subscriptionStatus: null,
      }),
    ).toBe(true);
  });

  test("is not pending after Polar activates Pro", () => {
    expect(
      isCheckoutActivationPending({
        plan: "pro",
        subscriptionStatus: "active",
      }),
    ).toBe(false);
  });

  test("is not pending after the subscription is canceled or revoked", () => {
    expect(
      isCheckoutActivationPending({
        plan: "free",
        subscriptionStatus: "revoked",
      }),
    ).toBe(false);
    expect(
      isCheckoutActivationPending({
        plan: "free",
        subscriptionStatus: "canceled",
      }),
    ).toBe(false);
  });
});
