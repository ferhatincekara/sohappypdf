import { describe, expect, test } from "bun:test";
import {
  createAnonymousSessionService,
  createMemoryAnonymousSessionRepository,
} from "@repo/auth";
import type { ResourceOwnerTransferInput } from "@repo/files";
import { claimAnonymousSession } from "./claim-anonymous-session.js";

const now = new Date("2026-08-28T12:00:00.000Z");

function createTransferProbe() {
  const calls: ResourceOwnerTransferInput[] = [];

  return {
    calls,
    transferOwner: async (input: ResourceOwnerTransferInput) => {
      calls.push(input);
      return { transferred: 1 };
    },
  };
}

describe("claimAnonymousSession", () => {
  test("does not transfer when no anonymous cookie is present", async () => {
    const files = createTransferProbe();
    const conversions = createTransferProbe();

    const result = await claimAnonymousSession({
      rawToken: undefined,
      userId: "user_1",
      anonymousSessions: createAnonymousSessionService({
        repository: createMemoryAnonymousSessionRepository(),
        retentionMs: 60_000,
        now: () => now,
      }),
      files,
      conversions,
      now,
    });

    expect(result).toEqual({ claimed: false, cookieShouldClear: false });
    expect(files.calls).toEqual([]);
    expect(conversions.calls).toEqual([]);
  });

  test("transfers files and conversions then asks to clear the cookie", async () => {
    const anonymousSessions = createAnonymousSessionService({
      repository: createMemoryAnonymousSessionRepository(),
      retentionMs: 60_000,
      now: () => now,
    });
    const created = await anonymousSessions.resolveFromToken(undefined);
    const files = createTransferProbe();
    const conversions = createTransferProbe();

    const result = await claimAnonymousSession({
      rawToken: created.rawToken,
      userId: "user_1",
      anonymousSessions,
      files,
      conversions,
      now,
    });

    const expectedTransfer = {
      fromOwnerId: created.session.id,
      fromOwnerKind: "anonymous_session",
      toOwnerId: "user_1",
      toOwnerKind: "user",
      now,
    };

    expect(result).toEqual({ claimed: true, cookieShouldClear: true });
    expect(files.calls).toEqual([expectedTransfer]);
    expect(conversions.calls).toEqual([expectedTransfer]);
  });

  test("clears an invalid cookie without transferring", async () => {
    const files = createTransferProbe();
    const conversions = createTransferProbe();

    const result = await claimAnonymousSession({
      rawToken: "not-a-valid-anonymous-token",
      userId: "user_1",
      anonymousSessions: createAnonymousSessionService({
        repository: createMemoryAnonymousSessionRepository(),
        retentionMs: 60_000,
        now: () => now,
      }),
      files,
      conversions,
      now,
    });

    expect(result).toEqual({ claimed: false, cookieShouldClear: true });
    expect(files.calls).toEqual([]);
    expect(conversions.calls).toEqual([]);
  });
});
