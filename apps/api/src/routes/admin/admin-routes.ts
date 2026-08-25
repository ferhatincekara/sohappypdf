import type { BillingService } from "@repo/billing";
import { DEFAULT_API_CREDIT_PACKS } from "@repo/billing/plans";
import type { AdminConfig } from "@repo/config";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import type { ConversionQueueCounts } from "@repo/queue";
import { getConversionQueueCounts } from "@repo/queue";
import { Hono } from "hono";
import type { AdminQueryService } from "../../admin/admin-queries.js";
import type { AppEnv } from "../../app-env.js";
import { requireAdminMiddleware } from "../../middleware/require-admin.js";

export type AdminRoutesOptions = {
  config: AdminConfig;
  getQueries: () => AdminQueryService;
  getBillingService: () => BillingService;
  getQueueCounts?: () => Promise<ConversionQueueCounts>;
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

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

  admin.get("/executions", async (c) => {
    const executions = await options.getQueries().listExecutions({
      limit: parseLimit(c.req.query("limit"), 50),
      status: c.req.query("status"),
    });

    return c.json({ executions });
  });

  admin.get("/queues", async (c) => {
    try {
      const getQueueCounts = options.getQueueCounts ?? getConversionQueueCounts;
      const counts = await getQueueCounts();
      return c.json({ conversion: counts });
    } catch {
      return c.json({ conversion: null });
    }
  });

  admin.get("/billing", async (c) => {
    const billing = options.getBillingService();
    const insights = await options.getQueries().getBillingInsights();

    return c.json({
      plans: billing.getPlanCatalog(),
      apiCredits: DEFAULT_API_CREDIT_PACKS,
      usersByPlan: insights.usersByPlan,
      usage: insights.usage,
      ledger: insights.ledger,
    });
  });

  admin.post("/billing/adjustments", async (c) => {
    const actor = c.get("adminActor");

    if (actor === undefined) {
      throw new AppError({
        code: APP_ERROR_CODES.FORBIDDEN,
        message: "Administrator access required",
      });
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid adjustment payload",
      });
    }

    if (!isJsonObject(body)) {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid adjustment payload",
      });
    }

    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const source = body.source;
    const amount = body.amount;
    const reason = typeof body.reason === "string" ? body.reason : "";

    if (source !== "web" && source !== "api" && source !== "ai") {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Credit source must be web, API, or AI",
      });
    }

    if (typeof amount !== "number") {
      throw new AppError({
        code: APP_ERROR_CODES.VALIDATION_ERROR,
        message: "Adjustment amount must be a positive integer",
      });
    }

    await options.getBillingService().adjustCredits({
      userId,
      source,
      amount,
      reason,
      actorUserId: actor.userId,
    });

    return c.json({ ok: true });
  });

  return admin;
}
