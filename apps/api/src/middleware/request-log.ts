import type { Logger } from "@sohappypdf/logger";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../app-env.js";

export function requestLogMiddleware(
  logger: Logger,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const requestLogger = logger.child({
      requestId: c.get("requestId"),
    });
    c.set("logger", requestLogger);

    const startedAt = Date.now();

    await next();

    requestLogger.info("request completed", {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Date.now() - startedAt,
    });
  };
}
