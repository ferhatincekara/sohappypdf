import { loadAnonymousConfig } from "./anonymous-config.js";
import type { EnvSource } from "./env.js";
import { loadFileConfig } from "./file-config.js";

export const RETENTION_KINDS = [
  "anonymous",
  "authenticated",
  "output",
  "temporary",
] as const;

export type RetentionKind = (typeof RETENTION_KINDS)[number];

export type RetentionPolicy = {
  anonymousMs: number;
  authenticatedMs: number;
  outputMs: number;
  temporaryMs: number;
};

export function isRetentionKind(value: string): value is RetentionKind {
  return RETENTION_KINDS.some((kind) => kind === value);
}

/**
 * Single retention surface for temporary PDF processing artifacts.
 * Defaults are configuration-driven (FILE_RETENTION_HOURS /
 * ANONYMOUS_RETENTION_HOURS), not scattered literals.
 */
export function loadRetentionPolicy(
  source: EnvSource = process.env,
): RetentionPolicy {
  const file = loadFileConfig(source);
  const anonymous = loadAnonymousConfig(source);

  return {
    anonymousMs: anonymous.retentionMs,
    authenticatedMs: file.retentionMs,
    outputMs: file.retentionMs,
    temporaryMs: file.retentionMs,
  };
}

export function resolveRetentionMs(
  policy: RetentionPolicy,
  kind: RetentionKind,
): number {
  switch (kind) {
    case "anonymous":
      return policy.anonymousMs;
    case "authenticated":
      return policy.authenticatedMs;
    case "output":
      return policy.outputMs;
    case "temporary":
      return policy.temporaryMs;
  }
}

export function getExpirationDate(input: {
  createdAt: Date;
  retentionMs: number;
}): Date {
  return new Date(input.createdAt.getTime() + input.retentionMs);
}
