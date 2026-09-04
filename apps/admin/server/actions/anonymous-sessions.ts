"use server";

import {
  getAnonymousSessionService,
  writeAdminAuditEvent,
} from "@sohappypdf/auth";
import { createLogger } from "@sohappypdf/logger";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/server/auth/require-admin";
import { toAdminActionError } from "@/server/errors";

const logger = createLogger({ name: "admin" });

export async function revokeAnonymousSessionAction(input: {
  sessionId: string;
}): Promise<void> {
  const actor = await requireAdminAction();

  try {
    const deleted = await getAnonymousSessionService().deleteById(
      input.sessionId,
    );

    if (!deleted) {
      throw new Error("Anonymous session not found.");
    }

    await writeAdminAuditEvent({
      actorUserId: actor.userId,
      action: "anonymous-session.revoked",
      targetType: "anonymous_session",
      targetId: input.sessionId,
    });
    logger.info("admin.anonymous-session.revoked", {
      actorUserId: actor.userId,
      sessionId: input.sessionId,
    });
    revalidatePath("/anonymous-sessions");
    revalidatePath("/audit-logs");
  } catch (error) {
    throw toAdminActionError(error);
  }
}
