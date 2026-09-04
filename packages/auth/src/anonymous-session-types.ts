export type AnonymousSessionRecord = {
  id: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
};

export type AnonymousSession = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
};

export type ResolveAnonymousSessionResult = {
  session: AnonymousSession;
  rawToken: string;
  cookieShouldSet: boolean;
};

export type AnonymousSessionRepository = {
  insert(session: AnonymousSessionRecord): Promise<AnonymousSessionRecord>;
  findByTokenHash(
    tokenHash: string,
  ): Promise<AnonymousSessionRecord | undefined>;
  findById(id: string): Promise<AnonymousSessionRecord | undefined>;
  deleteById(id: string): Promise<boolean>;
  deleteExpired(input: { now: Date; limit: number }): Promise<number>;
};

export type AnonymousSessionService = {
  resolveFromToken(
    rawToken: string | undefined,
    now?: Date,
  ): Promise<ResolveAnonymousSessionResult>;
  findValidFromToken(
    rawToken: string | undefined,
    now?: Date,
  ): Promise<AnonymousSession | undefined>;
  findById(id: string): Promise<AnonymousSession | undefined>;
  deleteById(id: string): Promise<boolean>;
  deleteExpired(input?: {
    now?: Date;
    limit?: number;
  }): Promise<{ scanned: number; deleted: number }>;
};
