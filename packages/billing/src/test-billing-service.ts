import { loadBillingConfig } from "@repo/config";
import {
  type BillingService,
  createBillingService,
} from "./billing-service.js";
import type { PolarClient, VerifyPolarWebhook } from "./billing-types.js";
import { createMemoryBillingRepository } from "./memory-billing-repository.js";
import type { PlanCatalog } from "./plan-types.js";

export function createTestBillingService(options?: {
  now?: () => Date;
  polarClient?: PolarClient;
  verifyWebhook?: VerifyPolarWebhook;
  userEmails?: Record<string, string>;
  env?: Record<string, string | undefined>;
  planCatalog?: PlanCatalog;
}): BillingService {
  return createBillingService({
    repository: createMemoryBillingRepository({
      userEmails: options?.userEmails ?? {
        user_1: "user@example.com",
        user_2: "other@example.com",
      },
    }),
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
