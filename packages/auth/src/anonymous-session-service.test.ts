import { describe, expect, test } from "bun:test";
import { createMemoryAnonymousSessionRepository } from "./anonymous-session-memory.js";
import { createAnonymousSessionService } from "./anonymous-session-service.js";
import { ANONYMOUS_SESSION_TOKEN_PREFIX } from "./anonymous-session-token.js";

const RETENTION_MS = 2 * 60 * 60 * 1000;

describe("anonymous session service", () => {
  test("creates a new session when no token is present", async () => {
    const service = createAnonymousSessionService({
      repository: createMemoryAnonymousSessionRepository(),
      retentionMs: RETENTION_MS,
      now: () => new Date("2026-08-24T01:00:00.000Z"),
    });

    const resolved = await service.resolveFromToken(undefined);

    expect(resolved.cookieShouldSet).toBe(true);
    expect(resolved.rawToken.startsWith(ANONYMOUS_SESSION_TOKEN_PREFIX)).toBe(
      true,
    );
    expect(resolved.session.expiresAt.toISOString()).toBe(
      "2026-08-24T03:00:00.000Z",
    );
  });

  test("reuses a valid session and issues a new one after expiry", async () => {
    let current = new Date("2026-08-24T01:00:00.000Z");
    const service = createAnonymousSessionService({
      repository: createMemoryAnonymousSessionRepository(),
      retentionMs: RETENTION_MS,
      now: () => current,
    });

    const created = await service.resolveFromToken(undefined);
    const reused = await service.resolveFromToken(created.rawToken);

    expect(reused.cookieShouldSet).toBe(false);
    expect(reused.session.id).toBe(created.session.id);
    expect(reused.rawToken).toBe(created.rawToken);

    current = new Date("2026-08-24T03:00:00.000Z");
    const rotated = await service.resolveFromToken(created.rawToken);

    expect(rotated.cookieShouldSet).toBe(true);
    expect(rotated.session.id).not.toBe(created.session.id);
    expect(rotated.rawToken).not.toBe(created.rawToken);
  });

  test("deletes expired sessions idempotently", async () => {
    let current = new Date("2026-08-24T01:00:00.000Z");
    const service = createAnonymousSessionService({
      repository: createMemoryAnonymousSessionRepository(),
      retentionMs: RETENTION_MS,
      now: () => current,
    });

    await service.resolveFromToken(undefined);
    current = new Date("2026-08-24T03:00:00.000Z");

    const first = await service.deleteExpired({ limit: 10 });
    const second = await service.deleteExpired({ limit: 10 });

    expect(first).toEqual({ scanned: 1, deleted: 1 });
    expect(second).toEqual({ scanned: 0, deleted: 0 });
  });

  test("looks up a valid token without creating a replacement session", async () => {
    const service = createAnonymousSessionService({
      repository: createMemoryAnonymousSessionRepository(),
      retentionMs: RETENTION_MS,
      now: () => new Date("2026-08-24T01:00:00.000Z"),
    });
    const created = await service.resolveFromToken(undefined);

    const found = await service.findValidFromToken(created.rawToken);
    const missing = await service.findValidFromToken("anon_not-a-valid-token");
    const empty = await service.findValidFromToken(undefined);

    expect(found?.id).toBe(created.session.id);
    expect(missing).toBeUndefined();
    expect(empty).toBeUndefined();
  });
});
