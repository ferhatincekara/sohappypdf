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
  };
}
