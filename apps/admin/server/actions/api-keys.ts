"use server";

import { getApiKeyService } from "@sohappypdf/api-keys";
import { writeAdminAuditEvent } from "@sohappypdf/auth";
import { createLogger } from "@sohappypdf/logger";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/server/auth/require-admin";
import { toAdminActionError } from "@/server/errors";

const logger = createLogger({ name: "admin" });

export async function revokeApiKeyAction(input: {
  apiKeyId: string;
}): Promise<void> {
  const actor = await requireAdminAction();

  try {
    const revoked = await getApiKeyService().revoke(input.apiKeyId);
    await writeAdminAuditEvent({
      actorUserId: actor.userId,
      action: "api-key.revoked",
      targetType: "api_key",
      targetId: revoked.id,
      metadata: {
        userId: revoked.userId,
        keyPrefix: revoked.keyPrefix,
      },
    });
    logger.info("admin.api-key.revoked", {
      actorUserId: actor.userId,
      apiKeyId: revoked.id,
      userId: revoked.userId,
    });
    revalidatePath(`/users/${revoked.userId}`);
    revalidatePath("/api");
    revalidatePath("/audit-logs");
  } catch (error) {
    throw toAdminActionError(error);
  }
}
