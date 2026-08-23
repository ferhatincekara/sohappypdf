import type { WorkerConfig } from "@repo/config";
import {
  assertRequiredConversionBinaries,
  type NativeBinaryProbe,
} from "@repo/conversion-engines";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import { pingDatabase } from "@repo/db";
import { pingQueueConnection } from "@repo/queue";
import { getStorage } from "@repo/storage";

export type WorkerEnvironmentChecks = {
  probeBinaries(config: WorkerConfig): NativeBinaryProbe[];
  pingDatabase(): Promise<void>;
  pingQueue(): Promise<void>;
  pingStorage(): Promise<void>;
};

export function createWorkerEnvironmentChecks(): WorkerEnvironmentChecks {
  return {
    probeBinaries: assertRequiredConversionBinaries,
    pingDatabase,
    pingQueue: () => pingQueueConnection("worker"),
    pingStorage: () => getStorage().ping(),
  };
}

export async function verifyWorkerEnvironment(
  config: WorkerConfig,
  checks: WorkerEnvironmentChecks = createWorkerEnvironmentChecks(),
): Promise<NativeBinaryProbe[]> {
  const binaries = checks.probeBinaries(config);

  try {
    await checks.pingDatabase();
    await checks.pingQueue();
    await checks.pingStorage();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: "Required worker infrastructure is unavailable",
      cause: error,
    });
  }

  return binaries;
}
