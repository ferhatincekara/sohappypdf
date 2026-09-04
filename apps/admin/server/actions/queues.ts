"use server";

import { writeAdminAuditEvent } from "@sohappypdf/auth";
import { createLogger } from "@sohappypdf/logger";
import {
  pauseAdminQueue,
  removeAdminQueueJob,
  resumeAdminQueue,
  retryAdminQueueJob,
} from "@sohappypdf/queue";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/server/auth/require-admin";
import { toAdminActionError } from "@/server/errors";

const logger = createLogger({ name: "admin" });

export async function retryQueueJobAction(input: {
  queueName: string;
  jobId: string;
}): Promise<void> {
  const actor = await requireAdminAction();

  try {
    await retryAdminQueueJob(input);
    await writeAdminAuditEvent({
      actorUserId: actor.userId,
      action: "queue.job.retried",
      targetType: "queue_job",
      targetId: input.jobId,
      metadata: { queueName: input.queueName },
    });
    logger.info("admin.execution.retried", {
      actorUserId: actor.userId,
      queueName: input.queueName,
      jobId: input.jobId,
    });
    revalidatePath("/queues");
    revalidatePath("/audit-logs");
  } catch (error) {
    throw toAdminActionError(error);
  }
}

export async function removeQueueJobAction(input: {
  queueName: string;
  jobId: string;
}): Promise<void> {
  const actor = await requireAdminAction();

  try {
    await removeAdminQueueJob(input);
    await writeAdminAuditEvent({
      actorUserId: actor.userId,
      action: "queue.job.removed",
      targetType: "queue_job",
      targetId: input.jobId,
      metadata: { queueName: input.queueName },
    });
    logger.info("admin.queue.job.removed", {
      actorUserId: actor.userId,
      queueName: input.queueName,
      jobId: input.jobId,
    });
    revalidatePath("/queues");
    revalidatePath("/audit-logs");
  } catch (error) {
    throw toAdminActionError(error);
  }
}

export async function pauseQueueAction(queueName: string): Promise<void> {
  const actor = await requireAdminAction();

  try {
    await pauseAdminQueue(queueName);
    await writeAdminAuditEvent({
      actorUserId: actor.userId,
      action: "queue.paused",
      targetType: "queue",
      targetId: queueName,
    });
    revalidatePath("/queues");
    revalidatePath("/audit-logs");
  } catch (error) {
    throw toAdminActionError(error);
  }
}

export async function resumeQueueAction(queueName: string): Promise<void> {
  const actor = await requireAdminAction();

  try {
    await resumeAdminQueue(queueName);
    await writeAdminAuditEvent({
      actorUserId: actor.userId,
      action: "queue.resumed",
      targetType: "queue",
      targetId: queueName,
    });
    revalidatePath("/queues");
    revalidatePath("/audit-logs");
  } catch (error) {
    throw toAdminActionError(error);
  }
}
