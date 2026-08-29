import { getAnonymousSessionService } from "@sohappypdf/auth";
import { getBillingService } from "@sohappypdf/billing";
import { loadAuthConfig } from "@sohappypdf/config";
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
