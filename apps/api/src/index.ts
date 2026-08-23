import { getBillingService } from "@repo/billing";
import { createApp } from "./app.js";
import { createConfiguredRateLimitCheck } from "./rate-limit-factory.js";

const app = createApp({
  checkRateLimit: createConfiguredRateLimitCheck((userId) =>
    getBillingService().resolvePlan(userId),
  ),
});

export default app;
