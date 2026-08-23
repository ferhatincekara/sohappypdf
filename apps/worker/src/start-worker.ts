import { loadAppConfig, loadWorkerConfig } from "@repo/config";
import { createEngineRegistry } from "@repo/conversion-engines";
import { getConversionService } from "@repo/conversions";
import { getFileService } from "@repo/files";
import { createLogger } from "@repo/logger";
import { createConversionWorker } from "@repo/queue";
import { getStorage } from "@repo/storage";
import { createConversionProcessor } from "./processors/conversion-processor.js";

export function startConversionWorker(): { close(): Promise<void> } {
  const appConfig = loadAppConfig();
  const workerConfig = loadWorkerConfig();
  const logger = createLogger({
    name: "worker",
    level: appConfig.logLevel,
    format: appConfig.runtimeEnv === "production" ? "json" : "pretty",
  });

  const processJob = createConversionProcessor({
    conversions: getConversionService(),
    files: getFileService(),
    storage: getStorage(),
    engines: createEngineRegistry(workerConfig),
    config: workerConfig,
    logger,
  });

  const worker = createConversionWorker({
    processJob,
    concurrency: workerConfig.concurrency,
    lockDurationMs: workerConfig.conversionTimeoutMs + 30_000,
  });

  logger.info("worker started", {
    concurrency: workerConfig.concurrency,
    timeoutMs: workerConfig.conversionTimeoutMs,
  });

  return worker;
}
