import { Hono } from "hono";
import type { AppEnv } from "../app-env.js";

export const healthRoutes = new Hono<AppEnv>().get("/health", (c) => {
  return c.json({ status: "ok" });
});
