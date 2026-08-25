import { describe, expect, test } from "bun:test";
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

function createAdminTestApp(identity: RequestIdentity) {
  return createApp({
    config: { corsOrigins: [] },
    logger: silentLogger,
    resolveIdentity: async () => identity,
    adminConfig: { userIds: ["admin_1"], emails: [] },
    adminQueries: createMemoryAdminQueryService({
      actors: [adminActor],
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
});
