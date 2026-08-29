import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import type { BillingSubscriptionRecord } from "./billing-types.js";
import { resolveWebMaxFilesPerOperation } from "./default-plan-limits.js";
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

export function isActiveApiSubscription(
  subscription: {
    status: BillingSubscriptionRecord["status"];
    endedAt: Date | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: Date | null;
  } | null,
  now: Date,
): boolean {
  if (subscription === null) {
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
  limit: number | null;
}): void {
  if (input.limit === null) {
    return;
  }

  if (input.used >= input.limit) {
    throw new AppError({
      code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
      message: "Daily processing limit reached",
    });
  }
}

export function assertCanUseFileCount(input: {
  fileCount: number;
  maxFilesPerOperation: number | null;
  toolMaxInputCount?: number;
  combinesSourceFiles?: boolean;
  supportsBatch?: boolean;
}): void {
  const maxFiles = resolveWebMaxFilesPerOperation({
    isAuthenticated: true,
    toolMaxInputCount: input.toolMaxInputCount ?? 1,
    planMaxFilesPerOperation: input.maxFilesPerOperation,
    combinesSourceFiles: input.combinesSourceFiles === true,
    supportsBatch: input.supportsBatch === true,
  });

  if (input.fileCount > maxFiles) {
    throw new AppError({
      code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
      message: "Too many files for the current plan",
    });
  }
}

export function assertCanUsePageCount(input: {
  pageCount: number;
  maxPagesPerFile: number | null;
}): void {
  if (input.maxPagesPerFile === null) {
    return;
  }

  if (input.pageCount > input.maxPagesPerFile) {
    throw new AppError({
      code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
      message: `File exceeds the ${String(input.maxPagesPerFile)} page limit`,
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

export function assertCanSpendAiCredits(input: {
  used: number;
  granted: number;
  amount: number;
}): void {
  if (input.granted - input.used < input.amount) {
    throw new AppError({
      code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
      message: "Monthly AI credit limit reached",
    });
  }
}

export function assertCanSpendApiCredits(input: {
  used: number;
  granted: number;
  amount: number;
}): void {
  if (input.granted - input.used < input.amount) {
    throw new AppError({
      code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
      message: "API credit limit reached",
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
