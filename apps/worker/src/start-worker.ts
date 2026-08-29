import { getAnonymousSessionService } from "@sohappypdf/auth";
import { getBillingService } from "@sohappypdf/billing";
import {
  type EnvSource,
  loadFileConfig,
  type WorkerConfig,
} from "@sohappypdf/config";
import {
  createEngineRegistry,
  getSafeConversionTempDir,
  type NativeBinaryProbe,
} from "@sohappypdf/conversion-engines";
import { getConversionService } from "@sohappypdf/conversions";
import { getFileService } from "@sohappypdf/files";
import { createLogger, type Logger } from "@sohappypdf/logger";
import {
  CONVERSION_JOB_ATTEMPTS,
  CONVERSION_JOB_BACKOFF_DELAY_MS,
  CONVERSION_QUEUE_NAME,
  type ConversionJobProcessor,
  type ConversionWorker,
  closeQueues,
  createConversionWorker,
  createFileCleanupWorker,
  FILE_CLEANUP_INTERVAL_MS,
  FILE_CLEANUP_QUEUE_NAME,
  scheduleFileCleanup,
} from "@sohappypdf/queue";
import { getStorage } from "@sohappypdf/storage";
import {
  startWorkerHealthServer,
  type WorkerHealthServer,
  type WorkerHealthStatus,
} from "./health-server.js";
import { loadWorkerRuntimeConfig } from "./load-runtime-config.js";
import { createConversionProcessor } from "./processors/conversion-processor.js";
import { createFileCleanupProcessor } from "./processors/file-cleanup-processor.js";
import { startPendingConversionPoller } from "./processors/pending-conversion-poller.js";
import { createWorkerShutdown } from "./shutdown.js";
import {
  createWorkerEnvironmentChecks,
  verifyWorkerEnvironment,
  type WorkerEnvironmentChecks,
} from "./verify-environment.js";

export type WorkerRuntime = {
  shutdown(signal?: string): Promise<number>;
};

export type StartConversionWorkerRuntimeOptions = {
  env?: EnvSource;
  checks?: WorkerEnvironmentChecks;
  createProcessor?: (input: {
    config: WorkerConfig;
    logger: Logger;
  }) => ConversionJobProcessor;
  createQueueWorker?: typeof createConversionWorker;
  enableFileCleanup?: boolean;
  enablePendingPoller?: boolean;
  listenHealth?: boolean;
};

function createWorkerLogger(config: {
  logLevel: Logger["level"];
  format: "json" | "pretty";
}): Logger {
  return createLogger({
    name: "worker",
    level: config.logLevel,
    format: config.format,
  });
}

function logStartupSummary(
  logger: Logger,
  worker: WorkerConfig,
  binaries: NativeBinaryProbe[],
): void {
  logger.info("worker configuration", {
    concurrency: worker.concurrency,
    timeoutMs: worker.conversionTimeoutMs,
    shutdownTimeoutMs: worker.shutdownTimeoutMs,
    healthPort: worker.healthPort,
    queueName: CONVERSION_QUEUE_NAME,
    jobAttempts: CONVERSION_JOB_ATTEMPTS,
    backoffDelayMs: CONVERSION_JOB_BACKOFF_DELAY_MS,
    maxInputFileSizeBytes: worker.maxInputFileSizeBytes,
    maxOutputFileSizeBytes: worker.maxOutputFileSizeBytes,
    nativeBinaries: binaries.map((binary) => ({
      command: binary.command,
      version: binary.version,
    })),
  });

  if (worker.concurrency > 4) {
    logger.warn("high worker concurrency", {
      concurrency: worker.concurrency,
    });
  }
}

export async function startConversionWorkerRuntime(
  options: StartConversionWorkerRuntimeOptions = {},
): Promise<WorkerRuntime> {
  const runtimeConfig = loadWorkerRuntimeConfig(options.env);
  process.env.TMPDIR = getSafeConversionTempDir();
  const logger = createWorkerLogger({
    logLevel: runtimeConfig.app.logLevel,
    format: runtimeConfig.app.runtimeEnv === "production" ? "json" : "pretty",
  });
  let status: WorkerHealthStatus = "starting";
  const shutdownController = createWorkerShutdown({
    async closeWorker(force) {
      stopPendingPoller?.();
      stopFileCleanupFallback?.();
      await Promise.all([
        worker?.close(force) ?? Promise.resolve(),
        cleanupWorker?.close(force) ?? Promise.resolve(),
      ]);
    },
    async closeHealth() {
      if (health !== undefined) {
        await health.close();
      }
    },
    closeQueue: closeQueues,
    timeoutMs: runtimeConfig.worker.shutdownTimeoutMs,
    logger,
  });
  let health: WorkerHealthServer | undefined;
  let worker: ConversionWorker | undefined;
  let cleanupWorker: ConversionWorker | undefined;
  let stopPendingPoller: (() => void) | undefined;
  let stopFileCleanupFallback: (() => void) | undefined;

  logger.info("worker starting");

  if (options.listenHealth !== false) {
    health = await startWorkerHealthServer({
      port: runtimeConfig.worker.healthPort,
      state: {
        getStatus() {
          return shutdownController.isShuttingDown() ? "shutting_down" : status;
        },
      },
    });
    logger.info("worker health listening", { port: health.port });
  }

  try {
    const environment = await verifyWorkerEnvironment(
      runtimeConfig.worker,
      options.checks ?? createWorkerEnvironmentChecks(),
    );
    logStartupSummary(logger, runtimeConfig.worker, environment.binaries);

    if (!environment.queueAvailable) {
      logger.warn(
        "queue unavailable; processing pending conversions from the database",
      );
    }

    const createQueueWorker =
      options.createQueueWorker ?? createConversionWorker;
    const processJob =
      options.createProcessor?.({
        config: runtimeConfig.worker,
        logger,
      }) ??
      createConversionProcessor({
        conversions: getConversionService(),
        files: getFileService(),
        storage: getStorage(),
        engines: createEngineRegistry(runtimeConfig.worker),
        config: runtimeConfig.worker,
        logger,
        billing: getBillingService(),
      });

    try {
      worker = createQueueWorker({
        processJob,
        concurrency: runtimeConfig.worker.concurrency,
        lockDurationMs: runtimeConfig.worker.conversionTimeoutMs + 30_000,
        hooks: {
          onReady() {
            logger.info("queue connected", {
              queueName: CONVERSION_QUEUE_NAME,
            });
          },
          onCompleted(job) {
            logger.info("job completed", {
              jobId: job.id,
              conversionId: job.conversionId,
            });
          },
          onFailed(job) {
            logger.warn(job.permanent ? "job failed" : "job retrying", {
              jobId: job.id,
              conversionId: job.conversionId,
              attemptsMade: job.attemptsMade,
            });
          },
          async onPermanentFailure(conversionId) {
            try {
              const conversions = getConversionService();
              const current = await conversions.getConversion(conversionId);

              if (
                current.status === "pending" ||
                current.status === "queued" ||
                current.status === "processing"
              ) {
                await conversions.markFailed(conversionId, {
                  errorCode: "processing_failed",
                  errorMessage: "Conversion could not be processed",
                });
              }
            } catch {
              logger.error(
                "permanent conversion failure could not be recorded",
                {
                  conversionId,
                },
              );
            }
          },
          onError() {
            logger.error("queue worker error");
          },
        },
      });
    } catch {
      logger.warn("queue worker unavailable; using database fallback");
    }

    if (options.enablePendingPoller !== false) {
      stopPendingPoller = startPendingConversionPoller({
        conversions: getConversionService(),
        files: getFileService(),
        processJob,
        logger,
        isShuttingDown: () => shutdownController.isShuttingDown(),
      }).stop;
    }

    if (options.enableFileCleanup !== false) {
      const fileConfig = loadFileConfig(options.env);
      const processCleanup = createFileCleanupProcessor({
        files: getFileService(),
        conversions: getConversionService(),
        anonymousSessions: getAnonymousSessionService(),
        logger,
        batchSize: fileConfig.cleanupBatchSize,
      });

      try {
        cleanupWorker = createFileCleanupWorker({
          processJob: processCleanup,
          hooks: {
            onReady() {
              logger.info("queue connected", {
                queueName: FILE_CLEANUP_QUEUE_NAME,
              });
            },
            onCompleted(job) {
              logger.info("file cleanup job completed", { jobId: job.id });
            },
            onFailed(job) {
              logger.warn("file cleanup job retrying", {
                jobId: job.id,
                attemptsMade: job.attemptsMade,
              });
            },
            onError() {
              logger.error("file cleanup worker error");
            },
          },
        });
        await scheduleFileCleanup();
        logger.info("file cleanup scheduled", {
          intervalMs: FILE_CLEANUP_INTERVAL_MS,
          batchSize: fileConfig.cleanupBatchSize,
        });
      } catch {
        const timer = setInterval(() => {
          void processCleanup({
            id: "db:file-cleanup",
            attemptsMade: 0,
          });
        }, FILE_CLEANUP_INTERVAL_MS);
        stopFileCleanupFallback = () => {
          clearInterval(timer);
        };
        logger.warn("file cleanup queue unavailable; using interval fallback");
      }
    }

    status = "ready";
    logger.info("worker started", {
      concurrency: runtimeConfig.worker.concurrency,
      timeoutMs: runtimeConfig.worker.conversionTimeoutMs,
    });

    return {
      shutdown(signal) {
        shutdownController.begin();
        status = "shutting_down";
        return shutdownController.shutdown(signal);
      },
    };
  } catch (error) {
    if (health !== undefined) {
      await health.close();
    }

    await closeQueues();
    throw error;
  }
}
