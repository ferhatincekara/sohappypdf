import { closeConversionQueue } from "./conversion-queue.js";
import { closeFileCleanupQueue } from "./file-cleanup-queue.js";
import { closeQueueConnections } from "./queue-connection.js";

export async function closeQueues(): Promise<void> {
  await closeConversionQueue();
  await closeFileCleanupQueue();
  await closeQueueConnections();
}
