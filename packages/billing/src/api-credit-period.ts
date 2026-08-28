import type { ApiSubscriptionRecord } from "./billing-types.js";
import { isActiveApiSubscription } from "./entitlements.js";
import {
  getUtcMonthPeriod,
  resolveAnchoredMonthPeriod,
  type UsagePeriod,
} from "./usage-period.js";

const YEARLY_BILLING_SPAN_MS = 40 * 24 * 60 * 60 * 1000;

export function resolveApiCreditPeriod(input: {
  subscription:
    | Pick<
        ApiSubscriptionRecord,
        | "status"
        | "endedAt"
        | "cancelAtPeriodEnd"
        | "currentPeriodStart"
        | "currentPeriodEnd"
      >
    | null
    | undefined;
  now: Date;
}): UsagePeriod {
  const subscription = input.subscription ?? null;

  if (
    subscription === null ||
    !isActiveApiSubscription(subscription, input.now) ||
    subscription.currentPeriodStart === null
  ) {
    return getUtcMonthPeriod(input.now);
  }

  const start = subscription.currentPeriodStart;
  const end = subscription.currentPeriodEnd;

  if (
    end === null ||
    end.getTime() - start.getTime() > YEARLY_BILLING_SPAN_MS
  ) {
    return resolveAnchoredMonthPeriod({
      anchorStart: start,
      now: input.now,
    });
  }

  return { start, end };
}
