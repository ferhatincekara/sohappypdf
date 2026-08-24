import { Hono } from "hono";
import type { AppEnv } from "../app-env.js";
import { createOpenApiDocument } from "../public-contract/openapi.js";

export const openApiRoutes = new Hono<AppEnv>().get("/openapi.json", (c) => {
  return c.json(createOpenApiDocument());
});
