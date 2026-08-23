import { redactFields } from "./redact.js";

export const LOG_LEVELS = ["error", "warn", "info", "debug"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LogFields = Readonly<Record<string, unknown>>;

export type Logger = {
  readonly level: LogLevel;
  error(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  debug(message: string, fields?: LogFields): void;
  child(fields: LogFields): Logger;
};

export type LoggerFormat = "pretty" | "json";

export type CreateLoggerOptions = {
  level?: LogLevel;
  name?: string;
  fields?: LogFields;
  format?: LoggerFormat;
};

function writeToConsole(level: LogLevel, line: string): void {
  switch (level) {
    case "error":
      console.error(line);
      return;
    case "warn":
      console.warn(line);
      return;
    case "info":
      console.info(line);
      return;
    case "debug":
      console.debug(line);
      return;
  }
}

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const level = options.level ?? "info";
  const format = options.format ?? "pretty";
  const baseFields = options.fields ?? {};
  const name = options.name;

  const write = (
    entryLevel: LogLevel,
    message: string,
    fields?: LogFields,
  ): void => {
    if (LOG_LEVEL_RANK[entryLevel] < LOG_LEVEL_RANK[level]) {
      return;
    }

    const merged: Record<string, unknown> = { ...baseFields };

    if (name !== undefined) {
      merged.name = name;
    }

    if (fields !== undefined) {
      Object.assign(merged, fields);
    }

    const safeFields = redactFields(merged);
    const time = new Date().toISOString();

    if (format === "json") {
      writeToConsole(
        entryLevel,
        JSON.stringify({
          ...safeFields,
          level: entryLevel,
          time,
          message,
        }),
      );
      return;
    }

    const fieldKeys = Object.keys(safeFields);
    const fieldText =
      fieldKeys.length === 0 ? "" : ` ${JSON.stringify(safeFields)}`;
    writeToConsole(
      entryLevel,
      `${time} ${entryLevel.toUpperCase()} ${message}${fieldText}`,
    );
  };

  return {
    level,
    error(message, fields) {
      write("error", message, fields);
    },
    warn(message, fields) {
      write("warn", message, fields);
    },
    info(message, fields) {
      write("info", message, fields);
    },
    debug(message, fields) {
      write("debug", message, fields);
    },
    child(fields) {
      return createLogger({
        level,
        name,
        format,
        fields: {
          ...baseFields,
          ...fields,
        },
      });
    },
  };
}
