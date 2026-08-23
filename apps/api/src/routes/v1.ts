import type { ApiKeyService } from "@repo/api-keys";
import type { ConversionService } from "@repo/conversions";
import type { FileService } from "@repo/files";
import type { ConversionJobData } from "@repo/queue";
import { Hono } from "hono";
import type { AppEnv } from "../app-env.js";
import { createApiKeyRoutes } from "./api-keys/index.js";
import { createConversionRoutes } from "./conversions/index.js";
import { createFileRoutes } from "./files/index.js";
import { healthRoutes } from "./health.js";

export type V1RoutesOptions = {
  getFileService: () => FileService;
  getConversionService: () => ConversionService;
  getApiKeyService: () => ApiKeyService;
  enqueueConversion: (input: ConversionJobData) => Promise<unknown>;
  maxUploadFileSizeBytes?: number;
};

export function createV1Routes(options: V1RoutesOptions) {
  const v1 = new Hono<AppEnv>();
  v1.route("/", healthRoutes);
  v1.route("/files", createFileRoutes(options));
  v1.route("/conversions", createConversionRoutes(options));
  v1.route("/api-keys", createApiKeyRoutes(options));
  return v1;
}
