import { loadRateLimitConfig } from "@sohappypdf/config";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { createLogger } from "@sohappypdf/logger";
import {
  createRateLimitPolicies,
  createRateLimitService,
} from "@sohappypdf/rate-limit";

const logger = createLogger({ name: "admin" });

let limiter: ReturnType<typeof createRateLimitService> | undefined;

function getAdminRateLimiter() {
  if (limiter !== undefined) {
    return limiter;
  }

  const config = loadRateLimitConfig();

  if (config.redis === undefined) {
    return undefined;
  }

  limiter = createRateLimitService({
    redis: config.redis,
    policies: createRateLimitPolicies({
      anonymousPerMinute: config.anonymousPerMinute,
      authenticatedPerMinute: Math.min(config.authenticatedPerMinute, 60),
      apiPerMinute: config.apiPerMinute,
    }),
  });

  return limiter;
}

export async function consumeAdminRateLimit(userId: string): Promise<void> {
  const service = getAdminRateLimiter();

  if (service === undefined) {
    return;
  }

  try {
    const decision = await service.consume({
      kind: "user",
      userId: `admin:${userId}`,
    });

    if (decision.failedOpen) {
      logger.warn("admin.rate-limit.failed-open");
      return;
    }

    if (!decision.allowed) {
      throw new AppError({
        code: APP_ERROR_CODES.RATE_LIMITED,
        message: "Too many admin requests. Try again shortly.",
      });
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.warn("admin.rate-limit.unavailable");
  }
}
