import { loadAnonymousConfig } from "@repo/config";
import { getDb } from "@repo/db";
import { createAnonymousSessionRepository } from "./anonymous-session-repository.js";
import { createAnonymousSessionService } from "./anonymous-session-service.js";
import type { AnonymousSessionService } from "./anonymous-session-types.js";

let anonymousSessionService: AnonymousSessionService | undefined;

export function getAnonymousSessionService(): AnonymousSessionService {
  if (anonymousSessionService === undefined) {
    anonymousSessionService = createAnonymousSessionService({
      repository: createAnonymousSessionRepository(getDb()),
      retentionMs: loadAnonymousConfig().retentionMs,
    });
  }

  return anonymousSessionService;
}
