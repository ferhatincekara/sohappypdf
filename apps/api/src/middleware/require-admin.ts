import type { AdminConfig } from "@repo/config";
import { isAdminAllowlisted } from "@repo/config";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { MiddlewareHandler } from "hono";
import type { AdminActor } from "../admin/admin-actor.js";
import type { AppEnv } from "../app-env.js";
import { requireSessionIdentity } from "../auth/request-identity.js";

export type ResolveAdminActor = (userId: string) => Promise<AdminActor | null>;

export function requireAdminActor(
  actor: AdminActor | null,
  config: AdminConfig,
): AdminActor {
  if (actor === null) {
    throw new AppError({
      code: APP_ERROR_CODES.FORBIDDEN,
      message: "Administrator access required",
    });
  }

  if (
    !isAdminAllowlisted({ userId: actor.userId, email: actor.email }, config)
  ) {
    throw new AppError({
      code: APP_ERROR_CODES.FORBIDDEN,
      message: "Administrator access required",
    });
  }

  return actor;
}

export function requireAdminMiddleware(options: {
  config: AdminConfig;
  resolveActor: ResolveAdminActor;
}): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const session = requireSessionIdentity(c.get("identity"));
    const actor = requireAdminActor(
      await options.resolveActor(session.userId),
      options.config,
    );

    c.set("adminActor", actor);
    await next();
  };
}
