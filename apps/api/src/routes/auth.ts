import { toAuthHandlerErrorResponse } from "@sohappypdf/auth";
import { Hono } from "hono";
import type { AppEnv } from "../app-env.js";

export type HandleAuthRequest = (
  request: Request,
) => Promise<Response> | Response;

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

export async function createAuthFetchRequest(
  request: Request,
  url: string = request.url,
): Promise<Request> {
  const method = request.method;
  const headers = new Headers(request.headers);

  if (METHODS_WITHOUT_BODY.has(method)) {
    return new Request(url, { method, headers });
  }

  const body = await request.arrayBuffer();

  return new Request(url, {
    method,
    headers,
    body: body.byteLength === 0 ? undefined : body,
  });
}

export function createAuthRoutes(handleAuth: HandleAuthRequest) {
  const routes = new Hono<AppEnv>();

  routes.on(["GET", "POST"], "/:path{.+}", async (c) => {
    try {
      return await handleAuth(
        await createAuthFetchRequest(c.req.raw, c.req.url),
      );
    } catch (error) {
      const authErrorResponse = toAuthHandlerErrorResponse(error);

      if (authErrorResponse !== undefined) {
        return authErrorResponse;
      }

      c.get("logger")?.error("auth handler failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      throw error instanceof Error
        ? error
        : new Error("Authentication request failed");
    }
  });

  return routes;
}
