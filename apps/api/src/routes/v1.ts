import type { FileService } from "@repo/files";
import { Hono } from "hono";
import type { AppEnv } from "../app-env.js";
import { createFileRoutes } from "./files/index.js";
import { healthRoutes } from "./health.js";

export type V1RoutesOptions = {
  getFileService: () => FileService;
  maxUploadFileSizeBytes?: number;
};

export function createV1Routes(options: V1RoutesOptions) {
  const v1 = new Hono<AppEnv>();
  v1.route("/", healthRoutes);
  v1.route("/files", createFileRoutes(options));
  return v1;
}
