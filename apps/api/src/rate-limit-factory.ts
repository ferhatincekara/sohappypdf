import type { PlanId } from "@repo/billing";
import { loadRateLimitConfig } from "@repo/config";
import {
  createRateLimitPolicies,
  createRateLimitService,
  type RateLimitSubject,
} from "@repo/rate-limit";
import type { CheckRateLimit } from "./middleware/rate-limit.js";

export type ResolveRateLimitPlan = (userId: string) => Promise<PlanId>;

function subjectUserId(subject: RateLimitSubject): string | undefined {
  if (subject.kind === "user") {
    return subject.userId;
  }

  if (subject.kind === "api-client") {
    return subject.userId;
  }

  return undefined;
}

export function createConfiguredRateLimitCheck(
  resolvePlan?: ResolveRateLimitPlan,
): CheckRateLimit | undefined {
  const config = loadRateLimitConfig();

  // Redis is optional so local and CI can boot without Upstash. Production
  // should set both REST values. Missing config disables the middleware.
  if (config.redis === undefined) {
    return undefined;
  }

  const freeService = createRateLimitService({
    redis: config.redis,
    policies: createRateLimitPolicies({
      anonymousPerMinute: config.anonymousPerMinute,
      authenticatedPerMinute: config.freeAuthenticatedPerMinute,
      apiPerMinute: config.freeApiPerMinute,
    }),
  });
  const proService = createRateLimitService({
    redis: config.redis,
    policies: createRateLimitPolicies(config),
  });

  return async (subject) => {
    const userId = subjectUserId(subject);
    const plan =
      userId === undefined || resolvePlan === undefined
        ? "free"
        : await resolvePlan(userId);

    return plan === "pro"
      ? proService.consume(subject)
      : freeService.consume(subject);
  };
}
