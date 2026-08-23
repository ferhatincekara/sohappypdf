import { assertPolarWebhookSecret, type PolarConfig } from "@repo/config";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { BillingRepository } from "./billing-repository.js";
import type { VerifyPolarWebhook } from "./billing-types.js";
import {
  isSubscriptionWebhookType,
  parsePolarSubscription,
  planFromPolarProductId,
} from "./polar-subscription.js";
import { verifyPolarWebhook } from "./polar-webhook.js";

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
    subscription: {
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
