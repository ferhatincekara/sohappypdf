import type { PolarConfig } from "@repo/config";
import {
  apiProductKeyFromPolarProductId,
  packCreditsForPolarProduct,
} from "./polar-products.js";

export const ORDER_WEBHOOK_TYPES = [
  "order.created",
  "order.updated",
  "order.paid",
] as const;

export type OrderWebhookType = (typeof ORDER_WEBHOOK_TYPES)[number];

export type ParsedPolarOrder = {
  polarOrderId: string;
  polarCustomerId: string | null;
  externalUserId: string | null;
  paid: boolean;
  productIds: readonly string[];
};

export function isOrderWebhookType(value: string): value is OrderWebhookType {
  return ORDER_WEBHOOK_TYPES.some((type) => type === value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function readProductId(value: unknown): string | undefined {
  const direct = readString(value);
  if (direct !== undefined) {
    return direct;
  }

  const record = asRecord(value);
  return readString(record?.id) ?? readString(record?.productId);
}

export function parsePolarOrder(data: unknown): ParsedPolarOrder | undefined {
  const record = asRecord(data);

  if (record === undefined) {
    return undefined;
  }

  const polarOrderId = readString(record.id);

  if (polarOrderId === undefined) {
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

  const status = readString(record.status)?.toLowerCase();
  const paid =
    record.paid === true ||
    status === "paid" ||
    status === "completed" ||
    typeof record.paidAt === "string" ||
    typeof record.paid_at === "string";

  const productIds = new Set<string>();
  const rootProduct =
    readProductId(record.productId) ??
    readProductId(record.product_id) ??
    readProductId(record.product);

  if (rootProduct !== undefined) {
    productIds.add(rootProduct);
  }

  const items = record.items ?? record.orderItems ?? record.order_items;
  if (Array.isArray(items)) {
    for (const item of items) {
      const itemRecord = asRecord(item);
      const itemProduct =
        readProductId(itemRecord?.productId) ??
        readProductId(itemRecord?.product_id) ??
        readProductId(itemRecord?.product);
      if (itemProduct !== undefined) {
        productIds.add(itemProduct);
      }
    }
  }

  return {
    polarOrderId,
    polarCustomerId,
    externalUserId,
    paid,
    productIds: [...productIds],
  };
}

export function apiPackCreditsFromOrder(
  order: ParsedPolarOrder,
  polar: PolarConfig,
): number {
  let total = 0;

  for (const productId of order.productIds) {
    if (apiProductKeyFromPolarProductId(productId, polar) !== undefined) {
      continue;
    }

    const credits = packCreditsForPolarProduct(productId, polar);
    if (credits !== undefined) {
      total += credits;
    }
  }

  return total;
}
