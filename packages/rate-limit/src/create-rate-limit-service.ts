import type { RateLimitRedisConfig } from "@repo/config";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  type RateLimitSubject,
  selectRateLimitKind,
} from "./rate-limit-identity.js";
import { createRateLimitKey } from "./rate-limit-key.js";
import type {
  RateLimitPolicies,
  RateLimitPolicy,
} from "./rate-limit-policy.js";
import type { RateLimitDecision } from "./rate-limit-result.js";

const RATE_LIMIT_PREFIX = "sohappypdf:ratelimit";
const RATE_LIMIT_TIMEOUT_MS = 1_000;

export type CreateRateLimitServiceOptions = {
  redis: RateLimitRedisConfig;
  policies: RateLimitPolicies;
};

export type RateLimitService = {
  consume(subject: RateLimitSubject): Promise<RateLimitDecision>;
};

function createRateLimitRedis(config: RateLimitRedisConfig): Redis {
  return new Redis({
    url: config.restUrl,
    token: config.restToken,
  });
}

function createLimiter(redis: Redis, policy: RateLimitPolicy): Ratelimit {
  return new Ratelimit({
    redis,
    prefix: `${RATE_LIMIT_PREFIX}:${policy.kind}`,
    limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
    timeout: RATE_LIMIT_TIMEOUT_MS,
    analytics: false,
  });
}

function toDecision(
  policy: RateLimitPolicy,
  result: {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    reason?: string;
  },
): RateLimitDecision {
  return {
    allowed: result.success,
    failedOpen: result.reason === "timeout",
    kind: policy.kind,
    limit: result.limit,
    remaining: result.remaining,
    resetAtMs: result.reset,
  };
}

function failOpenDecision(policy: RateLimitPolicy): RateLimitDecision {
  return {
    allowed: true,
    failedOpen: true,
    kind: policy.kind,
    limit: policy.limit,
    remaining: policy.limit,
    resetAtMs: 0,
  };
}

/**
 * Fail open when Upstash times out or is unreachable so a Redis outage
 * does not take the API offline. Callers must log `failedOpen` without
 * exposing Redis credentials or stack traces.
 */
export function createRateLimitService(
  options: CreateRateLimitServiceOptions,
): RateLimitService {
  const redis = createRateLimitRedis(options.redis);
  const limiters = {
    anonymous: createLimiter(redis, options.policies.anonymous),
    authenticated: createLimiter(redis, options.policies.authenticated),
    api: createLimiter(redis, options.policies.api),
  };

  return {
    async consume(subject) {
      const kind = selectRateLimitKind(subject);
      const policy = options.policies[kind];
      const key = createRateLimitKey(subject);

      try {
        const result = await limiters[kind].limit(key);
        return toDecision(policy, result);
      } catch {
        return failOpenDecision(policy);
      }
    },
  };
}
