import { type ApiConfig, loadApiConfig, loadAppConfig } from "@repo/config";
import { createLogger, type Logger } from "@repo/logger";
import { Hono } from "hono";
import type { AppEnv } from "./app-env.js";
import {
  createDefaultIdentityResolver,
  type ResolveRequestIdentity,
} from "./auth/request-identity.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { requestIdentityMiddleware } from "./middleware/request-identity.js";
import { requestLogMiddleware } from "./middleware/request-log.js";
import { healthRoutes } from "./routes/health.js";
import { createV1Routes } from "./routes/v1.js";

export type CreateAppOptions = {
  config?: ApiConfig;
  logger?: Logger;
  resolveIdentity?: ResolveRequestIdentity;
};

export function createApp(options: CreateAppOptions = {}) {
  const appConfig = loadAppConfig();
  const config = options.config ?? loadApiConfig();
  const logger =
    options.logger ??
    createLogger({
      name: "api",
      level: appConfig.logLevel,
      format: appConfig.runtimeEnv === "production" ? "json" : "pretty",
    });
  const resolveIdentity =
    options.resolveIdentity ?? createDefaultIdentityResolver();

  const app = new Hono<AppEnv>();

  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  app.use("*", requestIdMiddleware());
  app.use("*", requestLogMiddleware(logger));
  app.use("*", corsMiddleware(config));
  app.use("*", requestIdentityMiddleware(resolveIdentity));

  app.route("/", healthRoutes);
  app.route("/api/v1", createV1Routes());

  return app;
}

export type App = ReturnType<typeof createApp>;
