import type {
  AnonymousSessionRecord,
  AnonymousSessionRepository,
} from "./anonymous-session-types.js";

export function createMemoryAnonymousSessionRepository(
  seed: AnonymousSessionRecord[] = [],
): AnonymousSessionRepository {
  const records = new Map<string, AnonymousSessionRecord>(
    seed.map((session) => [session.id, { ...session }]),
  );

  return {
    async insert(session) {
      const created = { ...session };
      records.set(created.id, created);
      return { ...created };
    },

    async findByTokenHash(tokenHash) {
      const record = [...records.values()].find(
        (session) => session.tokenHash === tokenHash,
      );
      return record === undefined ? undefined : { ...record };
    },

    async findById(id) {
      const record = records.get(id);
      return record === undefined ? undefined : { ...record };
    },
  };
}
