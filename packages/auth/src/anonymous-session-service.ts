import { randomUUID } from "node:crypto";
import {
  generateAnonymousSessionToken,
  hashAnonymousSessionToken,
  isAnonymousSessionTokenFormat,
} from "./anonymous-session-token.js";
import type {
  AnonymousSession,
  AnonymousSessionRecord,
  AnonymousSessionRepository,
  AnonymousSessionService,
  ResolveAnonymousSessionResult,
} from "./anonymous-session-types.js";

export type CreateAnonymousSessionServiceOptions = {
  repository: AnonymousSessionRepository;
  retentionMs: number;
  now?: () => Date;
};

function toPublicSession(record: AnonymousSessionRecord): AnonymousSession {
  return {
    id: record.id,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  };
}

function isExpired(record: AnonymousSessionRecord, now: Date): boolean {
  return record.expiresAt.getTime() <= now.getTime();
}

export function createAnonymousSessionService(
  options: CreateAnonymousSessionServiceOptions,
): AnonymousSessionService {
  const now = options.now ?? (() => new Date());

  async function createSession(): Promise<ResolveAnonymousSessionResult> {
    const createdAt = now();
    const generated = generateAnonymousSessionToken();
    const record = await options.repository.insert({
      id: randomUUID(),
      tokenHash: generated.tokenHash,
      createdAt,
      expiresAt: new Date(createdAt.getTime() + options.retentionMs),
      lastSeenAt: createdAt,
    });

    return {
      session: toPublicSession(record),
      rawToken: generated.rawToken,
      cookieShouldSet: true,
    };
  }

  return {
    async resolveFromToken(rawToken, currentTime) {
      const at = currentTime ?? now();

      if (
        rawToken === undefined ||
        rawToken.length === 0 ||
        !isAnonymousSessionTokenFormat(rawToken)
      ) {
        return createSession();
      }

      const record = await options.repository.findByTokenHash(
        hashAnonymousSessionToken(rawToken),
      );

      if (record === undefined || isExpired(record, at)) {
        return createSession();
      }

      return {
        session: toPublicSession(record),
        rawToken,
        cookieShouldSet: false,
      };
    },
  };
}
