import {
  isLocalDevelopmentOrigin,
  type loadApiConfig,
  loadAppConfig,
} from "@repo/config";
import { cors } from "hono/cors";

export function corsMiddleware(config: ReturnType<typeof loadApiConfig>) {
  const runtimeEnv = loadAppConfig().runtimeEnv;
  const allowedOrigins = new Set(config.corsOrigins);

  return cors({
    origin(origin) {
      if (origin === undefined) {
        return allowedOrigins.size === 1
          ? [...allowedOrigins][0]
          : allowedOrigins.size > 0
            ? [...allowedOrigins][0]
            : undefined;
      }

      if (allowedOrigins.has(origin)) {
        return origin;
      }

      if (runtimeEnv === "development" && isLocalDevelopmentOrigin(origin)) {
        return origin;
      }

      return undefined;
    },
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
