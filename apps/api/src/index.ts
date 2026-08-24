import { getAnonymousSessionService } from "@repo/auth";
import { getBillingService } from "@repo/billing";
import { loadAuthConfig } from "@repo/config";
import { createApp } from "./app.js";
import { createConfiguredRateLimiters } from "./rate-limit-factory.js";

const limiters = createConfiguredRateLimiters((userId) =>
  getBillingService().resolvePlan(userId),
);

const app = createApp({
  checkRateLimit: limiters.checkRateLimit,
  checkAnonymousOperationRateLimit: limiters.checkAnonymousOperationRateLimit,
  anonymousSessionService: getAnonymousSessionService(),
  anonymousSessionCookieSecure: loadAuthConfig().useSecureCookies,
});

export default app;
