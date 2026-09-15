"use server";

import {
  restoreUserAccount,
  setUserSuspended,
  writeAdminAuditEvent,
} from "@sohappypdf/auth";
import { getBillingService } from "@sohappypdf/billing";
import { createLogger } from "@sohappypdf/logger";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/server/auth/require-admin";
import { toAdminActionError } from "@/server/errors";

const logger = createLogger({ name: "admin" });

export async function suspendUserAction(input: {
  userId: string;
  reason: string;
}): Promise<void> {
  const actor = await requireAdminAction();

  try {
    await setUserSuspended({
      userId: input.userId,
      actorUserId: actor.userId,
      reason: input.reason,
    });
    await writeAdminAuditEvent({
      actorUserId: actor.userId,
      action: "user.suspended",
      targetType: "user",
      targetId: input.userId,
      reason: input.reason,
    });
    logger.info("admin.user.suspended", {
      actorUserId: actor.userId,
      userId: input.userId,
    });
    revalidatePath(`/users/${input.userId}`);
    revalidatePath("/users");
    revalidatePath("/audit-logs");
  } catch (error) {
    throw toAdminActionError(error);
  }
}

export async function restoreUserAction(input: {
  userId: string;
}): Promise<void> {
  const actor = await requireAdminAction();

  try {
    await restoreUserAccount({ userId: input.userId });
    await writeAdminAuditEvent({
      actorUserId: actor.userId,
      action: "user.restored",
      targetType: "user",
      targetId: input.userId,
    });
    logger.info("admin.user.restored", {
      actorUserId: actor.userId,
      userId: input.userId,
    });
    revalidatePath(`/users/${input.userId}`);
    revalidatePath("/users");
    revalidatePath("/audit-logs");
  } catch (error) {
    throw toAdminActionError(error);
  }
}

export async function adjustCreditsAction(input: {
  userId: string;
  amount: number;
  reason: string;
}): Promise<void> {
  const actor = await requireAdminAction();

  try {
    const billing = getBillingService();

    await billing.adjustCredits({
      userId: input.userId,
      source: "api",
      amount: input.amount,
      reason: input.reason,
      actorUserId: actor.userId,
    });
    await writeAdminAuditEvent({
      actorUserId: actor.userId,
      action: "credits.adjusted",
      targetType: "user",
      targetId: input.userId,
      reason: input.reason,
      metadata: {
        source: "api",
        amount: input.amount,
      },
    });
    logger.info("admin.credits.adjusted", {
      actorUserId: actor.userId,
      userId: input.userId,
      source: "api",
      amount: input.amount,
    });
    revalidatePath(`/users/${input.userId}`);
    revalidatePath("/users");
    revalidatePath("/audit-logs");
  } catch (error) {
    throw toAdminActionError(error);
  }
}
