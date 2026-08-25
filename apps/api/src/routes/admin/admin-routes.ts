import type { AdminConfig } from "@repo/config";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import { Hono } from "hono";
import type { AdminQueryService } from "../../admin/admin-queries.js";
import type { AppEnv } from "../../app-env.js";
import { requireAdminMiddleware } from "../../middleware/require-admin.js";

export type AdminRoutesOptions = {
  config: AdminConfig;
  getQueries: () => AdminQueryService;
};

export function createAdminRoutes(options: AdminRoutesOptions) {
  const admin = new Hono<AppEnv>();

  admin.use(
    "*",
    requireAdminMiddleware({
      config: options.config,
      resolveActor: (userId) => options.getQueries().findActorByUserId(userId),
    }),
  );

  admin.get("/me", (c) => {
    const actor = c.get("adminActor");

    if (actor === undefined) {
      throw new AppError({
        code: APP_ERROR_CODES.FORBIDDEN,
        message: "Administrator access required",
      });
    }

    return c.json({
      userId: actor.userId,
      email: actor.email,
      name: actor.name,
    });
  });

  admin.get("/overview", async (c) => {
    return c.json(await options.getQueries().getOverview());
  });

  return admin;
}
