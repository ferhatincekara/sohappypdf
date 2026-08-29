import { assertServerOnly } from "@sohappypdf/core";

assertServerOnly("@sohappypdf/logger");

export type {
  CreateLoggerOptions,
  LogFields,
  Logger,
  LoggerFormat,
  LogLevel,
} from "./create-logger.js";
export { createLogger, LOG_LEVELS } from "./create-logger.js";
