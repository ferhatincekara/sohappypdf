import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import {
  type AdminAuditResult,
  adminAuditEvents,
  type Database,
  getDb,
} from "@sohappypdf/db";

export type AdminAuditEvent = {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  result: AdminAuditResult;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

export type WriteAdminAuditEventInput = {
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  result?: AdminAuditResult;
  metadata?: Record<string, unknown>;
};

const FORBIDDEN_METADATA_KEYS = [
  "password",
  "secret",
  "token",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "credential",
  "signedUrl",
  "signed_url",
];

function assertSafeAuditValue(name: string, value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: `${name} is required`,
    });
  }

  return trimmed;
}

function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (metadata === undefined) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const normalized = key.replaceAll("_", "").toLowerCase();

    if (
      FORBIDDEN_METADATA_KEYS.some((forbidden) =>
        normalized.includes(forbidden.replaceAll("_", "").toLowerCase()),
      )
    ) {
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function writeAdminAuditEvent(
  input: WriteAdminAuditEventInput,
  database: Database = getDb(),
): Promise<AdminAuditEvent> {
  const [row] = await database
    .insert(adminAuditEvents)
    .values({
      actorUserId: assertSafeAuditValue(
        "Administrator identity",
        input.actorUserId,
      ),
      action: assertSafeAuditValue("Action", input.action),
      targetType: assertSafeAuditValue("Target type", input.targetType),
      targetId: assertSafeAuditValue("Target", input.targetId),
      reason: input.reason?.trim() || null,
      result: input.result ?? "success",
      metadata: sanitizeAuditMetadata(input.metadata),
    })
    .returning();

  if (row === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: "Failed to record admin audit event",
    });
  }

  return {
    id: row.id,
    actorUserId: row.actorUserId,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    result: row.result === "failure" ? "failure" : "success",
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}
