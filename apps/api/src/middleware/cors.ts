import type { ApiConfig } from "@repo/config";
import { cors } from "hono/cors";

export function corsMiddleware(config: ApiConfig) {
  return cors({
    origin: [...config.corsOrigins],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "Idempotency-Key",
    ],
    exposeHeaders: ["X-Request-Id"],
  });
}
