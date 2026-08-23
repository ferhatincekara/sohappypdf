import { Hono } from "hono";
import type { AppEnv } from "../app-env.js";

export type HandleAuthRequest = (
  request: Request,
) => Promise<Response> | Response;

export function createAuthRoutes(handleAuth: HandleAuthRequest) {
  const routes = new Hono<AppEnv>();

  routes.on(["GET", "POST"], "/:path{.+}", (c) => handleAuth(c.req.raw));

  return routes;
}
