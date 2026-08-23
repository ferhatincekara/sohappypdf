import { assertServerOnly } from "@repo/core";

assertServerOnly("@repo/logger");

export type {
  CreateLoggerOptions,
  LogFields,
  Logger,
  LoggerFormat,
  LogLevel,
} from "./create-logger.js";
export { createLogger, LOG_LEVELS } from "./create-logger.js";
