import type { ApiKeyService } from "@repo/api-keys";
import type { BillingService } from "@repo/billing";
import type { ConversionService } from "@repo/conversions";
import type { FileService } from "@repo/files";
import type { ConversionJobData } from "@repo/queue";
import { Hono } from "hono";
import type { AppEnv } from "../app-env.js";
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
};

export function createV1Routes(options: V1RoutesOptions) {
  const v1 = new Hono<AppEnv>();
  v1.route("/", healthRoutes);
  v1.route("/", openApiRoutes);
  v1.route("/files", createFileRoutes(options));
  v1.route("/conversions", createConversionRoutes(options));
  v1.route("/api-keys", createApiKeyRoutes(options));
  v1.route("/billing", createBillingRoutes(options));
  return v1;
}
