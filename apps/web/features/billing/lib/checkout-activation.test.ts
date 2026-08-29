import { describe, expect, test } from "bun:test";
import {
  CHECKOUT_ACTIVATION_WAIT_MS,
  isCheckoutActivationPending,
  resolveCheckoutBanner,
} from "@/features/billing/lib/checkout-activation";

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

  test("is still pending when only included API credits are present", () => {
    expect(
      isCheckoutActivationPending({
        plan: "free",
        subscriptionStatus: null,
        api: {
          product: null,
          creditsLimit: 100,
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
          creditsLimit: 2000,
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

describe("CHECKOUT_ACTIVATION_WAIT_MS", () => {
  test("stops waiting for Polar after a short window", () => {
    expect(CHECKOUT_ACTIVATION_WAIT_MS).toBe(20_000);
  });
});

describe("resolveCheckoutBanner", () => {
  test("shows confirming only while Polar has not activated the purchase", () => {
    expect(resolveCheckoutBanner({ phase: "confirming", pending: true })).toBe(
      "confirming",
    );
    expect(
      resolveCheckoutBanner({ phase: "confirming", pending: false }),
    ).toBeNull();
  });

  test("asks the user to refresh after Polar confirmation times out", () => {
    expect(resolveCheckoutBanner({ phase: "unconfirmed", pending: true })).toBe(
      "unconfirmed",
    );
    expect(
      resolveCheckoutBanner({ phase: "unconfirmed", pending: false }),
    ).toBeNull();
    expect(resolveCheckoutBanner({ phase: "idle", pending: true })).toBeNull();
  });
});
