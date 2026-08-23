import {
  type ApiConfig,
  loadApiConfig,
  loadAppConfig,
  loadFileConfig,
} from "@repo/config";
import { type FileService, getFileService } from "@repo/files";
import { createLogger, type Logger } from "@repo/logger";
import { Hono } from "hono";
import type { AppEnv } from "./app-env.js";
import {
  createDefaultIdentityResolver,
  type ResolveRequestIdentity,
} from "./auth/request-identity.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import {
  type CheckRateLimit,
  rateLimitMiddleware,
} from "./middleware/rate-limit.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { requestIdentityMiddleware } from "./middleware/request-identity.js";
import { requestLogMiddleware } from "./middleware/request-log.js";
import { healthRoutes } from "./routes/health.js";
import { createV1Routes } from "./routes/v1.js";

export type CreateAppOptions = {
  config?: ApiConfig;
  logger?: Logger;
  resolveIdentity?: ResolveRequestIdentity;
  checkRateLimit?: CheckRateLimit;
  fileService?: FileService;
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

  if (options.checkRateLimit !== undefined) {
    // Applied to /api/v1/* so routes can share identity-based limiters.
    // /health and /api/v1/health are exempt inside the middleware.
    app.use("/api/v1/*", rateLimitMiddleware(options.checkRateLimit));
  }

  app.route("/", healthRoutes);
  app.route(
    "/api/v1",
    createV1Routes({
      getFileService: () => options.fileService ?? getFileService(),
      maxUploadFileSizeBytes: loadFileConfig().maxUploadFileSizeBytes,
    }),
  );

  return app;
}

export type App = ReturnType<typeof createApp>;
