import type { PlanId } from "@repo/billing";
import { loadAnonymousConfig, loadRateLimitConfig } from "@repo/config";
import {
  createRateLimitPolicies,
  createRateLimitService,
  type RateLimitSubject,
} from "@repo/rate-limit";
import type { CheckRateLimit } from "./middleware/rate-limit.js";

export type ResolveRateLimitPlan = (userId: string) => Promise<PlanId>;

export type ConfiguredRateLimiters = {
  checkRateLimit?: CheckRateLimit;
  checkAnonymousOperationRateLimit?: CheckRateLimit;
};

function subjectUserId(subject: RateLimitSubject): string | undefined {
  if (subject.kind === "user") {
    return subject.userId;
  }

  if (subject.kind === "api-client") {
    return subject.userId;
  }

  return undefined;
}

export function createConfiguredRateLimiters(
  resolvePlan?: ResolveRateLimitPlan,
): ConfiguredRateLimiters {
  const config = loadRateLimitConfig();

  // Redis is optional so local and CI can boot without Upstash. Production
  // should set both REST values. Missing config disables the middleware.
  if (config.redis === undefined) {
    return {};
  }

  const anonymousHourlyLimit = loadAnonymousConfig().operationsPerHour;
  const freeService = createRateLimitService({
    redis: config.redis,
    policies: createRateLimitPolicies({
      anonymousPerMinute: config.anonymousPerMinute,
      authenticatedPerMinute: config.freeAuthenticatedPerMinute,
      apiPerMinute: config.freeApiPerMinute,
    }),
    anonymousHourlyLimit,
  });
  const proService = createRateLimitService({
    redis: config.redis,
    policies: createRateLimitPolicies(config),
    anonymousHourlyLimit,
  });

  const resolveService = async (subject: RateLimitSubject) => {
    const userId = subjectUserId(subject);
    const plan =
      userId === undefined || resolvePlan === undefined
        ? "free"
        : await resolvePlan(userId);

    return plan === "pro" ? proService : freeService;
  };

  return {
    checkRateLimit: async (subject) =>
      (await resolveService(subject)).consume(subject),
    checkAnonymousOperationRateLimit: async (subject) => {
      if (subject.kind !== "anonymous") {
        return {
          allowed: true,
          failedOpen: false,
          kind: "anonymous",
          limit: anonymousHourlyLimit,
          remaining: anonymousHourlyLimit,
          resetAtMs: 0,
        };
      }

      return (await resolveService(subject)).consumeAnonymousOperation(subject);
    },
  };
}

export function createConfiguredRateLimitCheck(
  resolvePlan?: ResolveRateLimitPlan,
): CheckRateLimit | undefined {
  return createConfiguredRateLimiters(resolvePlan).checkRateLimit;
}
