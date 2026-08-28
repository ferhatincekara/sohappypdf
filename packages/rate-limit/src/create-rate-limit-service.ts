import type { RateLimitRedisConfig } from "@repo/config";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { combineAnonymousRateLimitDecisions } from "./anonymous-rate-limit.js";
import {
  type AnonymousRateLimitSubject,
  type RateLimitSubject,
  selectRateLimitKind,
} from "./rate-limit-identity.js";
import {
  createAnonymousRateLimitKeys,
  createRateLimitKey,
} from "./rate-limit-key.js";
import type {
  RateLimitPolicies,
  RateLimitPolicy,
} from "./rate-limit-policy.js";
import type { RateLimitDecision } from "./rate-limit-result.js";

const RATE_LIMIT_PREFIX = "sohappypdf:ratelimit";
const RATE_LIMIT_TIMEOUT_MS = 1_000;
const RATE_LIMIT_DAY_WINDOW = "1 d" as const;

export type CreateRateLimitServiceOptions = {
  redis: RateLimitRedisConfig;
  policies: RateLimitPolicies;
  anonymousDailyLimit?: number;
};

export type RateLimitService = {
  consume(subject: RateLimitSubject): Promise<RateLimitDecision>;
  consumeAnonymousOperation(
    subject: AnonymousRateLimitSubject,
  ): Promise<RateLimitDecision>;
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

async function consumeKey(
  limiter: Ratelimit,
  policy: RateLimitPolicy,
  key: string,
): Promise<RateLimitDecision> {
  try {
    return toDecision(policy, await limiter.limit(key));
  } catch {
    return failOpenDecision(policy);
  }
}

async function consumeAnonymousDual(
  limiter: Ratelimit,
  policy: RateLimitPolicy,
  subject: AnonymousRateLimitSubject,
): Promise<RateLimitDecision> {
  const keys = createAnonymousRateLimitKeys(subject);
  const [ipDecision, sessionDecision] = await Promise.all([
    consumeKey(limiter, policy, keys.ip),
    consumeKey(limiter, policy, keys.session),
  ]);

  return combineAnonymousRateLimitDecisions(ipDecision, sessionDecision);
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
  const anonymousDailyLimit = options.anonymousDailyLimit;
  const anonymousDailyLimiter =
    anonymousDailyLimit === undefined
      ? undefined
      : new Ratelimit({
          redis,
          prefix: `${RATE_LIMIT_PREFIX}:anonymous-daily`,
          limiter: Ratelimit.slidingWindow(
            anonymousDailyLimit,
            RATE_LIMIT_DAY_WINDOW,
          ),
          timeout: RATE_LIMIT_TIMEOUT_MS,
          analytics: false,
        });
  const anonymousDailyPolicy: RateLimitPolicy = {
    kind: "anonymous",
    limit: anonymousDailyLimit ?? options.policies.anonymous.limit,
    window: options.policies.anonymous.window,
  };

  return {
    async consume(subject) {
      const kind = selectRateLimitKind(subject);
      const policy = options.policies[kind];

      if (subject.kind === "anonymous") {
        return consumeAnonymousDual(limiters.anonymous, policy, subject);
      }

      return consumeKey(limiters[kind], policy, createRateLimitKey(subject));
    },

    async consumeAnonymousOperation(subject) {
      if (anonymousDailyLimiter === undefined) {
        return failOpenDecision(anonymousDailyPolicy);
      }

      return consumeAnonymousDual(
        anonymousDailyLimiter,
        anonymousDailyPolicy,
        subject,
      );
    },
  };
}
