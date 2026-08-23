import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/billing");

export type { BillingRepository } from "./billing-repository.js";
export { createBillingRepository } from "./billing-repository.js";
export type {
  BillingService,
  BillingServiceOptions,
} from "./billing-service.js";
export { createBillingService } from "./billing-service.js";
export { getBillingService } from "./billing-service-factory.js";
export type {
  BillingCustomerRecord,
  BillingSubscriptionRecord,
  PolarClient,
  PolarWebhookEvent,
  PublicBillingStatus,
  UsagePeriodRecord,
  VerifyPolarWebhook,
} from "./billing-types.js";
export {
  assertCanCreateApiKey,
  assertCanCreateConversion,
  assertCanUploadFile,
  isProSubscription,
  resolvePlan,
} from "./entitlements.js";
export { createMemoryBillingRepository } from "./memory-billing-repository.js";
export { DEFAULT_PLAN_LIMITS, getPlanLimits } from "./plan-config.js";
export type {
  BillingSubscriptionStatus,
  PlanCatalog,
  PlanId,
  PlanLimits,
  UserEntitlements,
} from "./plan-types.js";
export {
  BILLING_SUBSCRIPTION_STATUSES,
  isPlanId,
  PLANS,
} from "./plan-types.js";
export { createPolarClient } from "./polar-client.js";
export {
  isSubscriptionWebhookType,
  parsePolarSubscription,
  planFromPolarProductId,
} from "./polar-subscription.js";
export { verifyPolarWebhook } from "./polar-webhook.js";
export { createTestBillingService } from "./test-billing-service.js";
export { getUtcMonthPeriod } from "./usage-period.js";
export { handlePolarWebhook } from "./webhook-service.js";
