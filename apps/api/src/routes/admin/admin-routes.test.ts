import { describe, expect, test } from "bun:test";
import { createTestBillingService } from "@repo/billing";
import type { Logger } from "@repo/logger";
import { createMemoryAdminQueryService } from "../../admin/admin-queries.js";
import { createApp } from "../../app.js";
import type { RequestIdentity } from "../../auth/request-identity.js";

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

function createAdminTestApp(
  identity: RequestIdentity,
  billingService = createTestBillingService({
    userEmails: {
      admin_1: "ops@example.com",
      user_2: "member@example.com",
    },
  }),
) {
  return createApp({
    config: { corsOrigins: [] },
    logger: silentLogger,
    resolveIdentity: async () => identity,
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
          status: "failed",
          createdAt: "2026-08-24T12:00:00.000Z",
          completedAt: "2026-08-24T12:01:00.000Z",
          expiresAt: null,
        },
      ],
      overview: {
        users: 4,
        anonymousSessions: 2,
        executions: {
          pending: 0,
          queued: 1,
          processing: 1,
          completed: 8,
          failed: 1,
          cancelled: 0,
          expiredReady: 3,
        },
      },
    }),
  });
}

describe("admin routes", () => {
  test("requires a signed-in allowlisted operator", async () => {
    const anonymous = await createAdminTestApp({ kind: "anonymous" }).request(
      "/api/v1/admin/me",
    );
    expect(anonymous.status).toBe(401);

    const apiKey = await createAdminTestApp({
      kind: "api-key",
      userId: "admin_1",
      apiKeyId: "key_1",
    }).request("/api/v1/admin/me");
    expect(apiKey.status).toBe(403);

    const otherUser = await createAdminTestApp({
      kind: "session",
      userId: "user_9",
      sessionId: "session_9",
    }).request("/api/v1/admin/me");
    expect(otherUser.status).toBe(403);
  });

  test("returns operator profile and overview without secrets", async () => {
    const app = createAdminTestApp({
      kind: "session",
      userId: "admin_1",
      sessionId: "session_1",
    });

    const me = await app.request("/api/v1/admin/me");
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual(adminActor);

    const overview = await app.request("/api/v1/admin/overview");
    expect(overview.status).toBe(200);
    const body = await overview.json();
    expect(body.users).toBe(4);
    expect(body.anonymousSessions).toBe(2);
    expect(body.executions.expiredReady).toBe(3);
    expect(JSON.stringify(body)).not.toContain("password");
    expect(JSON.stringify(body)).not.toContain("token");
  });

  test("lists users and anonymous sessions without secrets", async () => {
    const app = createAdminTestApp({
      kind: "session",
      userId: "admin_1",
      sessionId: "session_1",
    });

    const users = await app.request("/api/v1/admin/users");
    expect(users.status).toBe(200);
    const usersBody = await users.json();
    expect(usersBody.users[0]?.email).toBe("member@example.com");
    expect(JSON.stringify(usersBody)).not.toContain("password");

    const sessions = await app.request("/api/v1/admin/anonymous-sessions");
    expect(sessions.status).toBe(200);
    const sessionsBody = await sessions.json();
    expect(sessionsBody.sessions).toHaveLength(1);
    expect(JSON.stringify(sessionsBody)).not.toContain("tokenHash");
    expect(JSON.stringify(sessionsBody)).not.toContain("token_hash");
  });

  test("lists processing executions without object keys", async () => {
    const app = createAdminTestApp({
      kind: "session",
      userId: "admin_1",
      sessionId: "session_1",
    });

    const response = await app.request("/api/v1/admin/executions");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.executions)).toBe(true);
    expect(JSON.stringify(body)).not.toContain("objectKey");
    expect(JSON.stringify(body)).not.toContain("s3");
  });

  test("returns queue counts without connecting when injected", async () => {
    const app = createApp({
      config: { corsOrigins: [] },
      logger: silentLogger,
      resolveIdentity: async () => ({
        kind: "session",
        userId: "admin_1",
        sessionId: "session_1",
      }),
      adminConfig: { userIds: ["admin_1"], emails: [] },
      adminQueries: createMemoryAdminQueryService({
        actors: [adminActor],
      }),
      getQueueCounts: async () => ({
        waiting: 2,
        active: 1,
        completed: 9,
        failed: 0,
        delayed: 0,
      }),
    });

    const response = await app.request("/api/v1/admin/queues");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.conversion).toEqual({
      waiting: 2,
      active: 1,
      completed: 9,
      failed: 0,
      delayed: 0,
    });
  });

  test("returns billing insights without Polar identifiers", async () => {
    const app = createAdminTestApp({
      kind: "session",
      userId: "admin_1",
      sessionId: "session_1",
    });

    const response = await app.request("/api/v1/admin/billing");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.plans.free.monthlyWebCredits).toBeDefined();
    expect(body.usersByPlan.free).toBe(1);
    expect(JSON.stringify(body)).not.toContain("polar");
    expect(JSON.stringify(body)).not.toContain("prod_");
  });

  test("applies an authorized credit adjustment with a reason", async () => {
    const app = createAdminTestApp({
      kind: "session",
      userId: "admin_1",
      sessionId: "session_1",
    });

    const response = await app.request("/api/v1/admin/billing/adjustments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: "user_2",
        source: "web",
        amount: 15,
        reason: "support goodwill credit",
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const audit = await app.request("/api/v1/admin/audit");
    expect(audit.status).toBe(200);
    const auditBody = await audit.json();
    expect(auditBody.events).toHaveLength(1);
    expect(auditBody.events[0]).toMatchObject({
      actorUserId: "admin_1",
      actorEmail: "ops@example.com",
      action: "billing.adjust_credits",
      targetType: "user",
      targetId: "user_2",
      reason: "support goodwill credit",
    });
    expect(JSON.stringify(auditBody)).not.toContain("password");
    expect(JSON.stringify(auditBody)).not.toContain("token");
    expect(JSON.stringify(auditBody)).not.toContain("polar");
  });

  test("rejects credit adjustments without a reason", async () => {
    const app = createAdminTestApp({
      kind: "session",
      userId: "admin_1",
      sessionId: "session_1",
    });

    const response = await app.request("/api/v1/admin/billing/adjustments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: "user_2",
        source: "web",
        amount: 15,
        reason: "no",
      }),
    });

    expect(response.status).toBe(400);

    const audit = await app.request("/api/v1/admin/audit");
    expect(audit.status).toBe(200);
    expect((await audit.json()).events).toEqual([]);
  });

  test("lists catalog tools as read-only operational metadata", async () => {
    const app = createAdminTestApp({
      kind: "session",
      userId: "admin_1",
      sessionId: "session_1",
    });

    const response = await app.request("/api/v1/admin/tools");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.tools)).toBe(true);
    expect(body.tools.length).toBeGreaterThan(0);
    expect(body.tools[0]).toHaveProperty("processorId");
    expect(body.tools[0]).toHaveProperty("health");
    expect(JSON.stringify(body)).not.toContain("AWS");
  });

  test("returns system health without infrastructure error details", async () => {
    const app = createApp({
      config: { corsOrigins: [] },
      logger: silentLogger,
      resolveIdentity: async () => ({
        kind: "session",
        userId: "admin_1",
        sessionId: "session_1",
      }),
      adminConfig: { userIds: ["admin_1"], emails: [] },
      adminQueries: createMemoryAdminQueryService({
        actors: [adminActor],
      }),
      billingService: createTestBillingService({
        userEmails: { admin_1: "ops@example.com" },
      }),
      getSystemHealth: async () => ({
        api: "ok",
        database: "ok",
        queue: "error",
        storage: "ok",
        worker: "not_configured",
        processingFailures: 4,
      }),
    });

    const response = await app.request("/api/v1/admin/health");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.api).toBe("ok");
    expect(body.queue).toBe("error");
    expect(body.worker).toBe("not_configured");
    expect(body.processingFailures).toBe(4);
    expect(JSON.stringify(body)).not.toContain("ECONNREFUSED");
    expect(JSON.stringify(body)).not.toContain("password");
  });
});
