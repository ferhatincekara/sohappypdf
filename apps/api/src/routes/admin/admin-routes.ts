import type { BillingService } from "@repo/billing";
import type { AdminConfig } from "@repo/config";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import { Hono } from "hono";
import type { AdminQueryService } from "../../admin/admin-queries.js";
import type { AppEnv } from "../../app-env.js";
import { requireAdminMiddleware } from "../../middleware/require-admin.js";

export type AdminRoutesOptions = {
  config: AdminConfig;
  getQueries: () => AdminQueryService;
  getBillingService: () => BillingService;
};

function parseLimit(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, 100);
}

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

  admin.get("/users", async (c) => {
    const users = await options.getQueries().listUsers({
      limit: parseLimit(c.req.query("limit"), 50),
      query: c.req.query("q"),
    });

    return c.json({ users });
  });

  admin.get("/users/:id", async (c) => {
    const userId = c.req.param("id");
    const record = await options.getQueries().getUser(userId);

    if (record === null) {
      throw new AppError({
        code: APP_ERROR_CODES.NOT_FOUND,
        message: "User not found",
      });
    }

    const billing = options.getBillingService();
    const entitlements = await billing.getEntitlements(userId);
    const webCredits = await billing.getWebCreditBalance(userId);
    const aiCredits = await billing.getAiCreditBalance(userId);
    const usage = await billing.getConversionUsage(userId);
    const executions = await options.getQueries().listExecutionsForOwner({
      ownerId: userId,
      limit: 20,
    });

    return c.json({
      user: record,
      plan: entitlements.plan,
      subscriptionStatus: entitlements.subscriptionStatus,
      webCredits,
      aiCredits,
      conversionsUsed: usage.conversionsUsed,
      recentExecutions: executions,
    });
  });

  admin.get("/anonymous-sessions", async (c) => {
    const sessions = await options.getQueries().listAnonymousSessions({
      limit: parseLimit(c.req.query("limit"), 50),
    });

    return c.json({ sessions });
  });

  return admin;
}
