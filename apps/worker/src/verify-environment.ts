import type { WorkerConfig } from "@repo/config";
import {
  assertRequiredConversionBinaries,
  type NativeBinaryProbe,
} from "@repo/conversion-engines";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import { pingDatabase } from "@repo/db";
import { pingQueueConnection } from "@repo/queue";
import { getStorage } from "@repo/storage";

export type WorkerInfrastructureName = "database" | "queue" | "storage";

export type WorkerEnvironmentChecks = {
  probeBinaries(config: WorkerConfig): NativeBinaryProbe[];
  pingDatabase(): Promise<void>;
  pingQueue(): Promise<void>;
  pingStorage(): Promise<void>;
};

const STARTUP_PING_ATTEMPTS = 3;
const STARTUP_PING_BACKOFF_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function wrapInfrastructureError(
  name: WorkerInfrastructureName,
  error: unknown,
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError({
    code: APP_ERROR_CODES.INTERNAL_ERROR,
    message: `Worker ${name} is unavailable`,
    cause: error,
  });
}

async function pingRequiredService(
  name: WorkerInfrastructureName,
  ping: () => Promise<void>,
): Promise<void> {
  try {
    await ping();
  } catch (error) {
    throw wrapInfrastructureError(name, error);
  }
}

async function pingWithRetry(
  name: WorkerInfrastructureName,
  ping: () => Promise<void>,
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= STARTUP_PING_ATTEMPTS; attempt += 1) {
    try {
      await ping();
      return;
    } catch (error) {
      lastError = error;

      if (attempt < STARTUP_PING_ATTEMPTS) {
        await sleep(STARTUP_PING_BACKOFF_MS * attempt);
      }
    }
  }

  throw wrapInfrastructureError(name, lastError);
}

export function createWorkerEnvironmentChecks(): WorkerEnvironmentChecks {
  return {
    probeBinaries: assertRequiredConversionBinaries,
    pingDatabase: () => pingWithRetry("database", pingDatabase),
    pingQueue: () =>
      pingWithRetry("queue", () => pingQueueConnection("worker")),
    pingStorage: () => pingWithRetry("storage", () => getStorage().ping()),
  };
}

export async function verifyWorkerEnvironment(
  config: WorkerConfig,
  checks: WorkerEnvironmentChecks = createWorkerEnvironmentChecks(),
): Promise<NativeBinaryProbe[]> {
  const binaries = checks.probeBinaries(config);

  await pingRequiredService("database", checks.pingDatabase);
  await pingRequiredService("queue", checks.pingQueue);
  await pingRequiredService("storage", checks.pingStorage);

  return binaries;
}
