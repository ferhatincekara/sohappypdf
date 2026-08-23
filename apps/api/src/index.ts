import { createApp } from "./app.js";
import { createConfiguredRateLimitCheck } from "./rate-limit-factory.js";

const app = createApp({
  checkRateLimit: createConfiguredRateLimitCheck(),
});

export default app;
