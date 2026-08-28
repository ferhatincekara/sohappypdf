import { describe, expect, test } from "bun:test";
import { createTestBillingService, DEFAULT_PLAN_LIMITS } from "@repo/billing";
import { DEFAULT_ANONYMOUS_CONFIG } from "@repo/config";
import { isConversionImplemented, isConversionType } from "@repo/conversions";
import { isAppError } from "@repo/core";
import { FILE_EXPIRED_MESSAGE } from "@repo/files";
import type { Logger } from "@repo/logger";
import {
  isAnonymousToolAllowed,
  listCatalogTools,
  listRegisteredTools,
} from "@repo/tools";
import { createMemoryAdminQueryService } from "./admin/admin-queries.js";
import { createApp } from "./app.js";
import { createOpenApiDocument } from "./public-contract/openapi.js";
import { resolveAnonymousConversionRequest } from "./routes/anonymous/anonymous-schemas.js";

const silentLogger: Logger = {
  level: "error",
  error() {},
  warn() {},
  info() {},
  debug() {},
  child() {
    return silentLogger;
  },
};

const adminActor = {
  userId: "admin_1",
  email: "ops@example.com",
  name: "Ops",
};

const SOURCE_FILE_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("end-to-end product coverage", () => {
  test("every public executable tool has a live processor and conversion engine", () => {
    const registered = listRegisteredTools();
    const planned = listCatalogTools().filter(
      (tool) => tool.availability === "planned",
    );

    expect(registered.length).toBeGreaterThan(0);
    expect(planned.map((tool) => tool.id).sort()).toEqual(
      [
        "ai-summarizer",
        "image-to-pdf",
        "pdf-forms",
        "translate-pdf",
        "web-to-pdf",
      ].sort(),
    );

    for (const tool of registered) {
      expect(isConversionType(tool.id)).toBe(true);
      if (isConversionType(tool.id)) {
        expect(isConversionImplemented(tool.id)).toBe(true);
      }
    }

    for (const tool of planned) {
      expect(isAnonymousToolAllowed(tool.id)).toBe(false);
    }
  });

  test("anonymous users cannot start premium or planned tools", () => {
    const blocked = [
      "protect-pdf",
      "unlock-pdf",
      "ocr-pdf",
      "sign-pdf",
      "ai-summarizer",
      "translate-pdf",
      "web-to-pdf",
    ] as const;

    for (const type of blocked) {
      expect(isAnonymousToolAllowed(type)).toBe(false);
      try {
        resolveAnonymousConversionRequest(
          { sourceFileId: SOURCE_FILE_ID, type },
          DEFAULT_ANONYMOUS_CONFIG,
        );
        throw new Error(`expected ${type} to be rejected`);
      } catch (error) {
        expect(isAppError(error)).toBe(true);
      }
    }

    const allowed = resolveAnonymousConversionRequest(
      { sourceFileId: SOURCE_FILE_ID, type: "pdf-to-png" },
      DEFAULT_ANONYMOUS_CONFIG,
    );
    expect(allowed.type).toBe("pdf-to-png");
  });

  test("Free AI credits stay at zero so Pro-only AI tools cannot run on Free", () => {
    expect(DEFAULT_PLAN_LIMITS.free.monthlyAiCredits).toBe(0);
    expect(DEFAULT_PLAN_LIMITS.pro.monthlyAiCredits).toBeGreaterThan(0);
    expect(DEFAULT_PLAN_LIMITS.pro.monthlyWebCredits).toBeGreaterThan(
      DEFAULT_PLAN_LIMITS.free.monthlyWebCredits,
    );
    expect(DEFAULT_PLAN_LIMITS.pro.maxFileSizeBytes).toBeGreaterThan(
      DEFAULT_PLAN_LIMITS.free.maxFileSizeBytes,
    );
  });

  test("expired files use the product-level message", () => {
    expect(FILE_EXPIRED_MESSAGE).toBe(
      "This file has expired. Please process it again.",
    );
  });

  test("the public OpenAPI contract does not publish admin routes", () => {
    const paths = Object.keys(createOpenApiDocument().paths);
    expect(paths.some((path) => path.includes("/admin"))).toBe(false);
  });

  test("an allowlisted operator can inspect users, executions, billing, tools, health, and audit", async () => {
    const billingService = createTestBillingService({
      userEmails: {
        admin_1: "ops@example.com",
        user_2: "member@example.com",
      },
    });
    const app = createApp({
      config: { corsOrigins: [] },
      logger: silentLogger,
      resolveIdentity: async () => ({
        kind: "session",
        userId: "admin_1",
        sessionId: "session_1",
      }),
      adminConfig: { userIds: ["admin_1"], emails: [] },
      billingService,
      adminQueries: createMemoryAdminQueryService({
        actors: [adminActor],
        users: [
          {
            userId: "user_2",
            email: "member@example.com",
            name: "Member",
            createdAt: "2026-08-01T00:00:00.000Z",
            plan: null,
          },
        ],
        userRecords: [
          {
            userId: "user_2",
            email: "member@example.com",
            name: "Member",
            emailVerified: true,
            createdAt: "2026-08-01T00:00:00.000Z",
            updatedAt: "2026-08-01T00:00:00.000Z",
          },
        ],
        anonymousSessions: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            createdAt: "2026-08-24T00:00:00.000Z",
            expiresAt: "2026-08-24T02:00:00.000Z",
            lastSeenAt: "2026-08-24T01:00:00.000Z",
          },
        ],
        executions: [
          {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            ownerId: "user_2",
            ownerKind: "user",
            tool: "merge-pdf",
            status: "completed",
            createdAt: "2026-08-24T12:00:00.000Z",
            completedAt: "2026-08-24T12:01:00.000Z",
            expiresAt: "2026-08-24T14:00:00.000Z",
          },
        ],
      }),
      getQueueCounts: async () => ({
        waiting: 1,
        active: 0,
        completed: 4,
        failed: 0,
        delayed: 0,
      }),
      getSystemHealth: async () => ({
        api: "ok",
        database: "ok",
        queue: "ok",
        storage: "ok",
        worker: "ok",
        processingFailures: 0,
      }),
    });

    const surfaces = [
      "/api/v1/admin/me",
      "/api/v1/admin/overview",
      "/api/v1/admin/users",
      "/api/v1/admin/users/user_2",
      "/api/v1/admin/anonymous-sessions",
      "/api/v1/admin/executions",
      "/api/v1/admin/queues",
      "/api/v1/admin/billing",
      "/api/v1/admin/tools",
      "/api/v1/admin/health",
      "/api/v1/admin/audit",
    ];

    for (const path of surfaces) {
      const response = await app.request(path);
      expect(response.status).toBe(200);
      const body = JSON.stringify(await response.json());
      expect(body).not.toContain("password");
      expect(body).not.toContain("tokenHash");
      expect(body).not.toContain("objectKey");
      expect(body).not.toContain("polar_at_");
    }

    const adjustment = await app.request("/api/v1/admin/billing/adjustments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: "user_2",
        source: "web",
        amount: 10,
        reason: "product coverage goodwill credit",
      }),
    });
    expect(adjustment.status).toBe(200);

    const audit = await app.request("/api/v1/admin/audit");
    const auditBody = await audit.json();
    expect(audit.status).toBe(200);
    expect(auditBody.events[0]).toMatchObject({
      action: "billing.adjust_credits",
      targetType: "user",
      targetId: "user_2",
      reason: "product coverage goodwill credit",
    });
    expect(JSON.stringify(auditBody)).not.toContain("polar");
  });

  test("API keys cannot use the admin console", async () => {
    const app = createApp({
      config: { corsOrigins: [] },
      logger: silentLogger,
      resolveIdentity: async () => ({
        kind: "api-key",
        userId: "admin_1",
        apiKeyId: "key_1",
      }),
      adminConfig: { userIds: ["admin_1"], emails: [] },
      adminQueries: createMemoryAdminQueryService({
        actors: [adminActor],
      }),
    });

    const response = await app.request("/api/v1/admin/audit");
    expect(response.status).toBe(403);
  });
});
