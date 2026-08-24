import type { BillingSubscriptionRecord } from "./billing-types.js";
import { isProSubscription } from "./entitlements.js";
import { getUtcMonthPeriod, type UsagePeriod } from "./usage-period.js";

export function resolveWebCreditPeriod(input: {
  subscription: BillingSubscriptionRecord | null;
  now: Date;
}): UsagePeriod {
  const subscription = input.subscription;

  if (
    subscription !== null &&
    isProSubscription(subscription, input.now) &&
    subscription.currentPeriodStart !== null &&
    subscription.currentPeriodEnd !== null
  ) {
    return {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    };
  }

  return getUtcMonthPeriod(input.now);
}
