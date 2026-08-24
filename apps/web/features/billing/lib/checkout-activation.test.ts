import { describe, expect, test } from "bun:test";
import { isCheckoutActivationPending } from "./checkout-activation";

describe("isCheckoutActivationPending", () => {
  test("is pending only while checkout has not produced a subscription yet", () => {
    expect(
      isCheckoutActivationPending({
        plan: "free",
        subscriptionStatus: null,
        api: {
          product: null,
          creditsLimit: 0,
        },
      }),
    ).toBe(true);
  });

  test("is not pending after Polar activates Pro", () => {
    expect(
      isCheckoutActivationPending({
        plan: "pro",
        subscriptionStatus: "active",
        api: {
          product: null,
          creditsLimit: 0,
        },
      }),
    ).toBe(false);
  });

  test("is not pending after an API product or pack is applied", () => {
    expect(
      isCheckoutActivationPending({
        plan: "free",
        subscriptionStatus: null,
        api: {
          product: "starter",
          creditsLimit: 1000,
        },
      }),
    ).toBe(false);
    expect(
      isCheckoutActivationPending({
        plan: "free",
        subscriptionStatus: null,
        api: {
          product: null,
          creditsLimit: 500,
        },
      }),
    ).toBe(false);
  });

  test("is not pending after the subscription is canceled or revoked", () => {
    expect(
      isCheckoutActivationPending({
        plan: "free",
        subscriptionStatus: "revoked",
        api: {
          product: null,
          creditsLimit: 0,
        },
      }),
    ).toBe(false);
    expect(
      isCheckoutActivationPending({
        plan: "free",
        subscriptionStatus: "canceled",
        api: {
          product: null,
          creditsLimit: 0,
        },
      }),
    ).toBe(false);
  });
});
