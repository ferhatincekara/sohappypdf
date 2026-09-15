import {
  BILLING_SUBSCRIPTION_STATUSES,
  type BillingSubscriptionStatus,
  type PlanId,
} from "./plan-types.js";

export const SUBSCRIPTION_WEBHOOK_TYPES = [
  "subscription.created",
  "subscription.updated",
  "subscription.active",
  "subscription.canceled",
  "subscription.uncanceled",
  "subscription.revoked",
  "subscription.past_due",
] as const;

export type SubscriptionWebhookType =
  (typeof SUBSCRIPTION_WEBHOOK_TYPES)[number];

export type PolarRecurringInterval = "month" | "year" | "week" | "day";

export type ParsedPolarSubscription = {
  polarSubscriptionId: string;
  polarCustomerId: string | null;
  polarProductId: string;
  externalUserId: string | null;
  status: BillingSubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  endedAt: Date | null;
  amountCents: number | null;
  recurringInterval: PolarRecurringInterval | null;
};

export function isSubscriptionWebhookType(
  value: string,
): value is SubscriptionWebhookType {
  return SUBSCRIPTION_WEBHOOK_TYPES.some((type) => type === value);
}

export function planFromPolarProductId(
  polarProductId: string,
  polar: {
    proProductId: string | undefined;
    proYearlyProductId?: string | undefined;
  },
): PlanId {
  if (
    polar.proProductId !== undefined &&
    polarProductId === polar.proProductId
  ) {
    return "pro";
  }

  if (
    polar.proYearlyProductId !== undefined &&
    polarProductId === polar.proYearlyProductId
  ) {
    return "pro";
  }

  return "free";
}

export function isBillingSubscriptionStatus(
  value: string,
): value is BillingSubscriptionStatus {
  return BILLING_SUBSCRIPTION_STATUSES.some((status) => status === value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value * (value < 1_000_000_000_000 ? 1000 : 1));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function readNestedId(
  record: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const nested = asRecord(record[key]);
    const id = readString(nested?.id);
    if (id !== undefined) {
      return id;
    }
  }

  return undefined;
}

function readNonNegativeInteger(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  return undefined;
}

function readRecurringInterval(value: unknown): PolarRecurringInterval | null {
  if (value === "month" || value === "monthly") {
    return "month";
  }

  if (value === "year" || value === "yearly") {
    return "year";
  }

  if (value === "week" || value === "weekly") {
    return "week";
  }

  if (value === "day" || value === "daily") {
    return "day";
  }

  return null;
}

function billedAmountFromPolar(record: Record<string, unknown>): {
  amountCents: number | null;
  recurringInterval: PolarRecurringInterval | null;
} {
  const discount = asRecord(record.discount);
  const discountType = readString(discount?.type);
  const duration = readString(discount?.duration);
  const basisPoints = readNonNegativeInteger(
    discount?.basisPoints ?? discount?.basis_points,
  );
  const percentage =
    discountType === "percentage" && basisPoints !== undefined
      ? basisPoints / 100
      : readNonNegativeInteger(discount?.percentage);
  const foreverDiscount =
    discount !== undefined && duration !== "once" && percentage === 100;
  const amount = readNonNegativeInteger(record.amount);

  return {
    amountCents: foreverDiscount ? 0 : (amount ?? null),
    recurringInterval: readRecurringInterval(
      record.recurringInterval ?? record.recurring_interval,
    ),
  };
}

export function parsePolarSubscription(
  data: unknown,
): ParsedPolarSubscription | undefined {
  const record = asRecord(data);

  if (record === undefined) {
    return undefined;
  }

  const polarSubscriptionId = readString(record.id);
  const polarProductId =
    readString(record.productId) ??
    readString(record.product_id) ??
    readNestedId(record, ["product"]);
  const statusValue = readString(record.status);

  if (
    polarSubscriptionId === undefined ||
    polarProductId === undefined ||
    statusValue === undefined ||
    !isBillingSubscriptionStatus(statusValue)
  ) {
    return undefined;
  }

  const customer = asRecord(record.customer);
  const polarCustomerId =
    readString(record.customerId) ??
    readString(record.customer_id) ??
    readString(customer?.id) ??
    null;
  const externalUserId =
    readString(record.externalCustomerId) ??
    readString(record.external_customer_id) ??
    readString(customer?.externalId) ??
    readString(customer?.external_id) ??
    null;

  const billed = billedAmountFromPolar(record);

  return {
    polarSubscriptionId,
    polarCustomerId,
    polarProductId,
    externalUserId,
    status: statusValue,
    cancelAtPeriodEnd:
      readBoolean(record.cancelAtPeriodEnd) ??
      readBoolean(record.cancel_at_period_end) ??
      false,
    currentPeriodStart: readDate(
      record.currentPeriodStart ?? record.current_period_start,
    ),
    currentPeriodEnd: readDate(
      record.currentPeriodEnd ?? record.current_period_end,
    ),
    endedAt: readDate(
      record.endedAt ?? record.ended_at ?? record.endsAt ?? record.ends_at,
    ),
    amountCents: billed.amountCents,
    recurringInterval: billed.recurringInterval,
  };
}
