import type { ApiKeyService } from "@repo/api-keys";
import type { BillingService } from "@repo/billing";
import type { AdminConfig, AnonymousConfig } from "@repo/config";
import type { ConversionService } from "@repo/conversions";
import type { FileService } from "@repo/files";
import type { ConversionJobData, ConversionQueueCounts } from "@repo/queue";
import { Hono } from "hono";
import type { AdminSystemHealth } from "../admin/admin-health.js";
import type { AdminQueryService } from "../admin/admin-queries.js";
import type { AppEnv } from "../app-env.js";
import type { CheckRateLimit } from "../middleware/rate-limit.js";
import { createAdminRoutes } from "./admin/index.js";
import { createAnonymousRoutes } from "./anonymous/index.js";
import { createApiKeyRoutes } from "./api-keys/index.js";
import { createBillingRoutes } from "./billing/index.js";
import { createConversionRoutes } from "./conversions/index.js";
import { createFileRoutes } from "./files/index.js";
import { healthRoutes } from "./health.js";
import { openApiRoutes } from "./openapi.js";

export type V1RoutesOptions = {
  getFileService: () => FileService;
  getConversionService: () => ConversionService;
  getApiKeyService: () => ApiKeyService;
  getBillingService: () => BillingService;
  enqueueConversion: (input: ConversionJobData) => Promise<unknown>;
  maxUploadFileSizeBytes?: number;
  anonymousConfig: AnonymousConfig;
  checkAnonymousOperationRateLimit?: CheckRateLimit;
  adminConfig: AdminConfig;
  getAdminQueries: () => AdminQueryService;
  getQueueCounts?: () => Promise<ConversionQueueCounts>;
  getSystemHealth: () => Promise<AdminSystemHealth>;
};

export function createV1Routes(options: V1RoutesOptions) {
  const v1 = new Hono<AppEnv>();
  v1.route("/", healthRoutes);
  v1.route("/", openApiRoutes);
  v1.route("/anonymous", createAnonymousRoutes(options));
  v1.route("/files", createFileRoutes(options));
  v1.route("/conversions", createConversionRoutes(options));
  v1.route("/api-keys", createApiKeyRoutes(options));
  v1.route("/billing", createBillingRoutes(options));
  v1.route(
    "/admin",
    createAdminRoutes({
      config: options.adminConfig,
      getQueries: options.getAdminQueries,
      getBillingService: options.getBillingService,
      getQueueCounts: options.getQueueCounts,
      getSystemHealth: options.getSystemHealth,
    }),
  );
  return v1;
}
