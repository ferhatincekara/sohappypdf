import { Hono } from "hono";
import type { AppEnv } from "../app-env.js";
import { healthRoutes } from "./health.js";

export function createV1Routes() {
  const v1 = new Hono<AppEnv>();
  v1.route("/", healthRoutes);
  return v1;
}
