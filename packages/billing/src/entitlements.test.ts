import { describe, expect, test } from "bun:test";
import { APP_ERROR_CODES, isAppError } from "@repo/core";
import type { BillingSubscriptionRecord } from "./billing-types.js";
import {
  assertCanCreateApiKey,
  assertCanCreateConversion,
  assertCanUploadFile,
  isProSubscription,
  resolvePlan,
} from "./entitlements.js";
import { DEFAULT_PLAN_LIMITS } from "./plan-config.js";

function subscription(
  overrides: Partial<BillingSubscriptionRecord> = {},
): BillingSubscriptionRecord {
  return {
    id: "sub_1",
    userId: "user_1",
    polarSubscriptionId: "polar_sub_1",
    polarProductId: "prod_pro",
    plan: "pro",
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodStart: new Date("2026-08-01T00:00:00.000Z"),
    currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
    endedAt: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides,
  };
}

const now = new Date("2026-08-15T12:00:00.000Z");

describe("resolvePlan", () => {
  test("resolves users without billing records to free", () => {
    expect(resolvePlan(null, now)).toBe("free");
  });

  test("grants Pro for active, trialing, and past_due subscriptions", () => {
    expect(isProSubscription(subscription({ status: "active" }), now)).toBe(
      true,
    );
    expect(isProSubscription(subscription({ status: "trialing" }), now)).toBe(
      true,
    );
    expect(isProSubscription(subscription({ status: "past_due" }), now)).toBe(
      true,
    );
    expect(resolvePlan(subscription({ status: "active" }), now)).toBe("pro");
  });

  test("keeps Pro when cancellation is scheduled for the end of the period", () => {
    expect(
      isProSubscription(
        subscription({
          status: "canceled",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
        }),
        now,
      ),
    ).toBe(true);
  });

  test("does not grant Pro for unpaid, revoked, paused, or ended subscriptions", () => {
    expect(resolvePlan(subscription({ status: "unpaid" }), now)).toBe("free");
    expect(resolvePlan(subscription({ status: "revoked" }), now)).toBe("free");
    expect(resolvePlan(subscription({ status: "paused" }), now)).toBe("free");
    expect(
      resolvePlan(
        subscription({
          status: "active",
          endedAt: new Date("2026-08-10T00:00:00.000Z"),
        }),
        now,
      ),
    ).toBe("free");
  });
});

describe("entitlement assertions", () => {
  test("rejects conversions after the monthly limit", () => {
    try {
      assertCanCreateConversion({ used: 20, limit: 20 });
      throw new Error("expected conversion limit to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.PLAN_LIMIT_REACHED);
      }
    }
  });

  test("rejects uploads that exceed the plan file size", () => {
    try {
      assertCanUploadFile({
        sizeBytes: DEFAULT_PLAN_LIMITS.free.maxFileSizeBytes + 1,
        storageUsedBytes: 0,
        limits: DEFAULT_PLAN_LIMITS.free,
      });
      throw new Error("expected file size limit to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.FILE_TOO_LARGE);
      }
    }
  });

  test("rejects uploads that exceed remaining storage", () => {
    try {
      assertCanUploadFile({
        sizeBytes: 1024,
        storageUsedBytes: DEFAULT_PLAN_LIMITS.free.storageBytes,
        limits: DEFAULT_PLAN_LIMITS.free,
      });
      throw new Error("expected storage limit to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.STORAGE_LIMIT_REACHED);
      }
    }
  });

  test("rejects extra API keys after the plan limit", () => {
    try {
      assertCanCreateApiKey({ used: 2, limit: 2 });
      throw new Error("expected API key limit to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(APP_ERROR_CODES.API_KEY_LIMIT_REACHED);
      }
    }
  });
});
