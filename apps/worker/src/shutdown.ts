import type { Logger } from "@sohappypdf/logger";

export type WorkerShutdownDependencies = {
  closeWorker(force?: boolean): Promise<void>;
  closeHealth(): Promise<void>;
  closeQueue(): Promise<void>;
  timeoutMs: number;
  logger: Logger;
};

export type WorkerShutdown = {
  begin(): void;
  isShuttingDown(): boolean;
  shutdown(signal?: string): Promise<number>;
};

async function closeWorkerWithTimeout(
  closeWorker: (force?: boolean) => Promise<void>,
  timeoutMs: number,
): Promise<"closed" | "forced"> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeout = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => {
        resolve("timeout");
      }, timeoutMs);
    });
    const closed = closeWorker(false).then(() => "closed" as const);
    const result = await Promise.race([closed, timeout]);

    if (result === "closed") {
      return "closed";
    }

    await closeWorker(true);
    return "forced";
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

export function createWorkerShutdown(
  dependencies: WorkerShutdownDependencies,
): WorkerShutdown {
  let shuttingDown = false;
  let inFlight: Promise<number> | undefined;

  const runShutdown = async (signal?: string): Promise<number> => {
    dependencies.logger.info("worker shutting down", {
      signal: signal ?? "shutdown",
    });

    const closeResult = await closeWorkerWithTimeout(
      dependencies.closeWorker,
      dependencies.timeoutMs,
    );

    if (closeResult === "forced") {
      dependencies.logger.warn("worker shutdown forced after timeout");
    }

    await dependencies.closeHealth();
    await dependencies.closeQueue();
    dependencies.logger.info("worker stopped");
    return closeResult === "forced" ? 1 : 0;
  };

  return {
    begin() {
      shuttingDown = true;
    },
    isShuttingDown() {
      return shuttingDown;
    },
    shutdown(signal) {
      shuttingDown = true;

      if (inFlight === undefined) {
        inFlight = runShutdown(signal);
      }

      return inFlight;
    },
  };
}
