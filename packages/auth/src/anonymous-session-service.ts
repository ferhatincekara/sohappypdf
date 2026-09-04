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

  async function findValidFromToken(
    rawToken: string | undefined,
    currentTime?: Date,
  ): Promise<AnonymousSession | undefined> {
    const at = currentTime ?? now();

    if (
      rawToken === undefined ||
      rawToken.length === 0 ||
      !isAnonymousSessionTokenFormat(rawToken)
    ) {
      return undefined;
    }

    const record = await options.repository.findByTokenHash(
      hashAnonymousSessionToken(rawToken),
    );

    if (record === undefined || isExpired(record, at)) {
      return undefined;
    }

    return toPublicSession(record);
  }

  return {
    findValidFromToken,

    async resolveFromToken(rawToken, currentTime) {
      const existing = await findValidFromToken(rawToken, currentTime);

      if (existing === undefined || rawToken === undefined) {
        return createSession();
      }

      return {
        session: existing,
        rawToken,
        cookieShouldSet: false,
      };
    },

    async findById(id) {
      const record = await options.repository.findById(id);

      if (record === undefined) {
        return undefined;
      }

      return toPublicSession(record);
    },

    async deleteById(id) {
      return options.repository.deleteById(id);
    },

    async deleteExpired(input = {}) {
      const at = input.now ?? now();
      const limit = input.limit ?? 100;
      const deleted = await options.repository.deleteExpired({
        now: at,
        limit,
      });

      return {
        scanned: deleted,
        deleted,
      };
    },
  };
}
