import { loadBillingConfig } from "@sohappypdf/config";
import {
  type BillingService,
  createBillingService,
} from "./billing-service.js";
import type { PolarClient, VerifyPolarWebhook } from "./billing-types.js";
import { createMemoryBillingRepository } from "./memory-billing-repository.js";
import type { PlanCatalog } from "./plan-types.js";
import { getUtcMonthPeriod } from "./usage-period.js";

export function createTestBillingService(options?: {
  now?: () => Date;
  polarClient?: PolarClient;
  verifyWebhook?: VerifyPolarWebhook;
  userEmails?: Record<string, string>;
  env?: Record<string, string | undefined>;
  planCatalog?: PlanCatalog;
  apiCreditGrants?: Record<string, number>;
}): BillingService {
  const now = options?.now ?? (() => new Date());
  const repository = createMemoryBillingRepository({
    userEmails: options?.userEmails ?? {
      user_1: "user@example.com",
      user_2: "other@example.com",
    },
  });
  const period = getUtcMonthPeriod(now());

  for (const [userId, amount] of Object.entries(
    options?.apiCreditGrants ?? {},
  )) {
    if (amount > 0) {
      void repository.upsertApiSubscription({
        userId,
        polarSubscriptionId: `sub_api_${userId}`,
        polarProductId: "prod_api_starter",
        productKey: "starter",
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        endedAt: null,
        updatedAt: now(),
      });
      void repository.ensureApiCreditGrant({
        userId,
        periodStart: period.start,
        periodEnd: period.end,
        grantAmount: amount,
        now: now(),
      });
    }
  }

  return createBillingService({
    repository,
    config: loadBillingConfig({
      POLAR_ACCESS_TOKEN: "polar_at_test",
      POLAR_WEBHOOK_SECRET: "whsec_test",
      POLAR_PRO_PRODUCT_ID: "prod_pro",
      APP_URL: "https://app.example",
      ...options?.env,
    }),
    polarClient: options?.polarClient,
    verifyWebhook: options?.verifyWebhook,
    planCatalog: options?.planCatalog,
    now: options?.now,
  });
}
