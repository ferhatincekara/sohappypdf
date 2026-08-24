import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { BillingSubscriptionRecord } from "./billing-types.js";
import type { PlanLimits } from "./plan-types.js";

export function isProSubscription(
  subscription: BillingSubscriptionRecord | null,
  now: Date,
): boolean {
  if (subscription === null || subscription.plan !== "pro") {
    return false;
  }

  if (
    subscription.endedAt !== null &&
    subscription.endedAt.getTime() <= now.getTime()
  ) {
    return false;
  }

  if (
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    subscription.status === "past_due"
  ) {
    return true;
  }

  return (
    subscription.status === "canceled" &&
    subscription.cancelAtPeriodEnd &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd.getTime() > now.getTime()
  );
}

export function resolvePlan(
  subscription: BillingSubscriptionRecord | null,
  now: Date,
): "free" | "pro" {
  return isProSubscription(subscription, now) ? "pro" : "free";
}

export function assertCanCreateConversion(input: {
  used: number;
  limit: number;
}): void {
  if (input.used >= input.limit) {
    throw new AppError({
      code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
      message: "Monthly conversion limit reached",
    });
  }
}

export function assertCanSpendWebCredits(input: {
  used: number;
  granted: number;
  amount: number;
}): void {
  if (input.granted - input.used < input.amount) {
    throw new AppError({
      code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
      message: "Monthly web tool credit limit reached",
    });
  }
}

export function assertCanUploadFile(input: {
  sizeBytes: number;
  storageUsedBytes: number;
  limits: PlanLimits;
}): void {
  if (input.sizeBytes > input.limits.maxFileSizeBytes) {
    throw new AppError({
      code: APP_ERROR_CODES.FILE_TOO_LARGE,
      message: "File exceeds the current plan size limit",
    });
  }

  if (input.storageUsedBytes + input.sizeBytes > input.limits.storageBytes) {
    throw new AppError({
      code: APP_ERROR_CODES.STORAGE_LIMIT_REACHED,
      message: "Storage limit reached",
    });
  }
}

export function assertCanCreateApiKey(input: {
  used: number;
  limit: number;
}): void {
  if (input.used >= input.limit) {
    throw new AppError({
      code: APP_ERROR_CODES.API_KEY_LIMIT_REACHED,
      message: "API key limit reached",
    });
  }
}
