import { assertServerOnly } from "@sohappypdf/core";

assertServerOnly("@sohappypdf/config");

export type { AiConfig } from "./ai-config.js";
export {
  DEFAULT_FREE_AI_CREDITS,
  DEFAULT_PRO_AI_CREDITS,
  loadAiConfig,
} from "./ai-config.js";
export type { AnonymousConfig } from "./anonymous-config.js";
export {
  DEFAULT_ANONYMOUS_CONFIG,
  DEFAULT_ANONYMOUS_MAX_FILE_SIZE_BYTES,
  DEFAULT_ANONYMOUS_MAX_FILES_PER_OPERATION,
  DEFAULT_ANONYMOUS_MAX_PAGES_PER_FILE,
  DEFAULT_ANONYMOUS_OPERATIONS_PER_DAY,
  DEFAULT_ANONYMOUS_RETENTION_HOURS,
  DEFAULT_ANONYMOUS_RETENTION_MS,
  loadAnonymousConfig,
} from "./anonymous-config.js";
export type { ApiConfig } from "./api-config.js";
export { loadApiConfig } from "./api-config.js";
export type {
  ApiCreditConfig,
  ApiProductKey,
} from "./api-credit-config.js";
export {
  API_PRODUCT_KEYS,
  DEFAULT_API_GROWTH_CREDITS,
  DEFAULT_API_SCALE_CREDITS,
  DEFAULT_API_STARTER_CREDITS,
  isApiProductKey,
  loadApiCreditConfig,
} from "./api-credit-config.js";
export type { AppConfig, LogLevel, RuntimeEnv } from "./app-config.js";
export { LOG_LEVELS, loadAppConfig, RUNTIME_ENVS } from "./app-config.js";
export type { AuthConfig, GoogleAuthConfig } from "./auth-config.js";
export { loadAuthConfig } from "./auth-config.js";
export { resolveAuthCookieDomain } from "./auth-cookie-domain.js";
export type {
  BillingConfig,
  PolarConfig,
  PolarServer,
} from "./billing-config.js";
export {
  assertPolarCheckoutConfig,
  assertPolarWebhookSecret,
  DEFAULT_BILLING_SUCCESS_PATH,
  loadBillingConfig,
  POLAR_SERVERS,
} from "./billing-config.js";
export type { DatabaseConfig } from "./database-config.js";
export { loadDatabaseConfig } from "./database-config.js";
export { isLocalDevelopmentOrigin } from "./dev-cors.js";
export type { EmailConfig } from "./email-config.js";
export {
  DEFAULT_RESEND_FROM_EMAIL,
  loadEmailConfig,
} from "./email-config.js";
export type { EnvSource } from "./env.js";
export { getOptionalEnv, getRequiredEnv } from "./env.js";
export { loadEnvFile } from "./env-file.js";
export type { FileConfig } from "./file-config.js";
export {
  DEFAULT_FILE_CLEANUP_BATCH_SIZE,
  DEFAULT_FILE_CONFIG,
  DEFAULT_FILE_RETENTION_HOURS,
  DEFAULT_FILE_RETENTION_MS,
  loadFileConfig,
  MAX_FILE_CLEANUP_BATCH_SIZE,
} from "./file-config.js";
export type { QueueConfig } from "./queue-config.js";
export { loadQueueConfig } from "./queue-config.js";
export type {
  RateLimitConfig,
  RateLimitRedisConfig,
} from "./rate-limit-config.js";
export {
  DEFAULT_RATE_LIMIT_CONFIG,
  loadRateLimitConfig,
} from "./rate-limit-config.js";
export type { RetentionKind, RetentionPolicy } from "./retention-policy.js";
export {
  getExpirationDate,
  isRetentionKind,
  loadRetentionPolicy,
  RETENTION_KINDS,
  resolveRetentionMs,
} from "./retention-policy.js";
export type { StorageConfig } from "./storage-config.js";
export { loadStorageConfig } from "./storage-config.js";
export type { WebCreditConfig } from "./web-credit-config.js";
export {
  DEFAULT_FREE_WEB_TOOL_CREDITS,
  DEFAULT_PRO_WEB_TOOL_CREDITS,
  loadWebCreditConfig,
} from "./web-credit-config.js";
export type { WorkerConfig } from "./worker-config.js";
export { DEFAULT_WORKER_CONFIG, loadWorkerConfig } from "./worker-config.js";
