import {
  type AppConfig,
  type DatabaseConfig,
  type EnvSource,
  loadAppConfig,
  loadDatabaseConfig,
  loadQueueConfig,
  loadWorkerConfig,
  type QueueConfig,
  type WorkerConfig,
} from "@repo/config";
import { getStorageConfig, type StorageConfig } from "@repo/storage";

export type WorkerRuntimeConfig = {
  app: AppConfig;
  worker: WorkerConfig;
  database: DatabaseConfig;
  queue: QueueConfig;
  storage: StorageConfig;
};

export function loadWorkerRuntimeConfig(
  source: EnvSource = process.env,
): WorkerRuntimeConfig {
  return {
    app: loadAppConfig(source),
    worker: loadWorkerConfig(source),
    database: loadDatabaseConfig(source),
    queue: loadQueueConfig(source),
    storage: getStorageConfig(source),
  };
}
