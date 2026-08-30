import { getAnonymousSessionService } from "@sohappypdf/auth";
import { getBillingService } from "@sohappypdf/billing";
import { loadAuthConfig, resolvePublicWebOrigins } from "@sohappypdf/config";
import { createLogger } from "@sohappypdf/logger";
import { getStorage } from "@sohappypdf/storage";
import { createApp } from "./app.js";
import { createConfiguredRateLimiters } from "./rate-limit-factory.js";

const limiters = createConfiguredRateLimiters((userId) =>
  getBillingService().resolvePlan(userId),
);

void (async () => {
  try {
    await getStorage().ensureBrowserUploadCors(resolvePublicWebOrigins());
  } catch (error: unknown) {
    createLogger({ name: "api" }).warn("s3 browser upload cors sync failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }
})();

const app = createApp({
  checkRateLimit: limiters.checkRateLimit,
  checkAnonymousOperationRateLimit: limiters.checkAnonymousOperationRateLimit,
  anonymousSessionService: getAnonymousSessionService(),
  anonymousSessionCookieSecure: loadAuthConfig().useSecureCookies,
});

export default app;
