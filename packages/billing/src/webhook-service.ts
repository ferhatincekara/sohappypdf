import { assertPolarWebhookSecret, type PolarConfig } from "@repo/config";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { BillingRepository } from "./billing-repository.js";
import type { VerifyPolarWebhook } from "./billing-types.js";
import { apiPackCreditsFromOrder, parsePolarOrder } from "./polar-order.js";
import {
  apiProductKeyFromPolarProductId,
  isWebProPolarProduct,
} from "./polar-products.js";
import {
  isSubscriptionWebhookType,
  parsePolarSubscription,
  planFromPolarProductId,
} from "./polar-subscription.js";
import { verifyPolarWebhook } from "./polar-webhook.js";
import { getUtcMonthPeriod } from "./usage-period.js";

export type HandlePolarWebhookInput = {
  body: string;
  headers: Record<string, string>;
  config: PolarConfig;
  repository: BillingRepository;
  verifyWebhook?: VerifyPolarWebhook;
  now?: () => Date;
};

export async function handlePolarWebhook(
  input: HandlePolarWebhookInput,
): Promise<{ outcome: "applied" | "duplicate" | "ignored" }> {
  const secret = assertPolarWebhookSecret(input.config);
  const verify = input.verifyWebhook ?? verifyPolarWebhook;
  const event = verify(input.body, input.headers, secret);
  const processedAt = (input.now ?? (() => new Date()))();

  if (event.type === "order.paid") {
    return handleOrderWebhook(
      input,
      event.id,
      event.type,
      event.data,
      processedAt,
    );
  }

  if (!isSubscriptionWebhookType(event.type)) {
    const claimed = await input.repository.applySubscriptionWebhook({
      provider: "polar",
      eventId: event.id,
      eventType: event.type,
      processedAt,
    });

    return { outcome: claimed ? "ignored" : "duplicate" };
  }

  const parsed = parsePolarSubscription(event.data);

  if (parsed === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid billing event",
    });
  }

  const userId = await resolveWebhookUserId(input.repository, parsed);

  if (userId === undefined) {
    const claimed = await input.repository.applySubscriptionWebhook({
      provider: "polar",
      eventId: event.id,
      eventType: event.type,
      processedAt,
    });

    return { outcome: claimed ? "ignored" : "duplicate" };
  }

  const isPro = isWebProPolarProduct(parsed.polarProductId, input.config);
  const apiProductKey = apiProductKeyFromPolarProductId(
    parsed.polarProductId,
    input.config,
  );

  if (!isPro && apiProductKey === undefined) {
    const claimed = await input.repository.applySubscriptionWebhook({
      provider: "polar",
      eventId: event.id,
      eventType: event.type,
      processedAt,
    });

    return { outcome: claimed ? "ignored" : "duplicate" };
  }

  const applied = await input.repository.applySubscriptionWebhook({
    provider: "polar",
    eventId: event.id,
    eventType: event.type,
    processedAt,
    customer:
      parsed.polarCustomerId === null
        ? undefined
        : {
            userId,
            polarCustomerId: parsed.polarCustomerId,
          },
    subscription: isPro
      ? {
          userId,
          polarSubscriptionId: parsed.polarSubscriptionId,
          polarProductId: parsed.polarProductId,
          plan: planFromPolarProductId(
            parsed.polarProductId,
            input.config.proProductId,
          ),
          status: parsed.status,
          cancelAtPeriodEnd: parsed.cancelAtPeriodEnd,
          currentPeriodStart: parsed.currentPeriodStart,
          currentPeriodEnd: parsed.currentPeriodEnd,
          endedAt: parsed.endedAt,
          updatedAt: processedAt,
        }
      : undefined,
    apiSubscription:
      apiProductKey === undefined
        ? undefined
        : {
            userId,
            polarSubscriptionId: parsed.polarSubscriptionId,
            polarProductId: parsed.polarProductId,
            productKey: apiProductKey,
            status: parsed.status,
            cancelAtPeriodEnd: parsed.cancelAtPeriodEnd,
            currentPeriodStart: parsed.currentPeriodStart,
            currentPeriodEnd: parsed.currentPeriodEnd,
            endedAt: parsed.endedAt,
            updatedAt: processedAt,
          },
  });

  return { outcome: applied ? "applied" : "duplicate" };
}

async function handleOrderWebhook(
  input: HandlePolarWebhookInput,
  eventId: string,
  eventType: string,
  data: unknown,
  processedAt: Date,
): Promise<{ outcome: "applied" | "duplicate" | "ignored" }> {
  const order = parsePolarOrder(data);
  const credits =
    order === undefined || !order.paid
      ? 0
      : apiPackCreditsFromOrder(order, input.config);

  if (order === undefined || !order.paid || credits < 1) {
    const claimed = await input.repository.applySubscriptionWebhook({
      provider: "polar",
      eventId,
      eventType,
      processedAt,
    });

    return { outcome: claimed ? "ignored" : "duplicate" };
  }

  const userId = await resolveWebhookUserId(input.repository, order);

  if (userId === undefined) {
    const claimed = await input.repository.applySubscriptionWebhook({
      provider: "polar",
      eventId,
      eventType,
      processedAt,
    });

    return { outcome: claimed ? "ignored" : "duplicate" };
  }

  const period = getUtcMonthPeriod(processedAt);
  const applied = await input.repository.applySubscriptionWebhook({
    provider: "polar",
    eventId,
    eventType,
    processedAt,
    customer:
      order.polarCustomerId === null
        ? undefined
        : {
            userId,
            polarCustomerId: order.polarCustomerId,
          },
    apiCreditTopUp: {
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      amount: credits,
    },
  });

  return { outcome: applied ? "applied" : "duplicate" };
}

async function resolveWebhookUserId(
  repository: BillingRepository,
  parsed: {
    externalUserId: string | null;
    polarCustomerId: string | null;
  },
): Promise<string | undefined> {
  if (parsed.externalUserId !== null) {
    return parsed.externalUserId;
  }

  if (parsed.polarCustomerId === null) {
    return undefined;
  }

  const customer = await repository.findCustomerByPolarId(
    parsed.polarCustomerId,
  );
  return customer?.userId;
}
