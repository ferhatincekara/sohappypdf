import { loadRateLimitConfig } from "@repo/config";
import {
  createRateLimitPolicies,
  createRateLimitService,
} from "@repo/rate-limit";
import type { CheckRateLimit } from "./middleware/rate-limit.js";

export function createConfiguredRateLimitCheck(): CheckRateLimit | undefined {
  const config = loadRateLimitConfig();

  // Redis is optional so local and CI can boot without Upstash. Production
  // should set both REST values. Missing config disables the middleware.
  if (config.redis === undefined) {
    return undefined;
  }

  const service = createRateLimitService({
    redis: config.redis,
    policies: createRateLimitPolicies(config),
  });

  return (subject) => service.consume(subject);
}
