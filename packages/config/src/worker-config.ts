import { APP_ERROR_CODES, AppError } from "@repo/core";
import { type EnvSource, getOptionalEnv } from "./env.js";

export type WorkerConfig = {
  concurrency: number;
  conversionTimeoutMs: number;
  shutdownTimeoutMs: number;
  healthPort: number;
  maxInputFileSizeBytes: number;
  maxOutputFileSizeBytes: number;
  maxTempDiskUsageBytes: number;
  libreOfficeBin: string;
  ghostscriptBin: string;
  pdftoppmBin: string;
  pdftotextBin: string;
};

export const DEFAULT_WORKER_CONFIG: WorkerConfig = {
  concurrency: 1,
  conversionTimeoutMs: 120_000,
  shutdownTimeoutMs: 130_000,
  healthPort: 8080,
  maxInputFileSizeBytes: 100 * 1024 * 1024,
  maxOutputFileSizeBytes: 150 * 1024 * 1024,
  maxTempDiskUsageBytes: 512 * 1024 * 1024,
  libreOfficeBin: "soffice",
  ghostscriptBin: "gs",
  pdftoppmBin: "pdftoppm",
  pdftotextBin: "pdftotext",
};

function parsePositiveInteger(
  name: string,
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Invalid ${name}`,
    });
  }

  return parsed;
}

function parsePort(
  name: string,
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: `Invalid ${name}`,
    });
  }

  return parsed;
}

function parseBinaryName(value: string | undefined, fallback: string): string {
  if (value === undefined) {
    return fallback;
  }

  if (!/^[A-Za-z0-9._-]+$/.test(value)) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid conversion binary name",
    });
  }

  return value;
}

export function loadWorkerConfig(
  source: EnvSource = process.env,
): WorkerConfig {
  const conversionTimeoutMs = parsePositiveInteger(
    "CONVERSION_TIMEOUT_MS",
    getOptionalEnv("CONVERSION_TIMEOUT_MS", source),
    DEFAULT_WORKER_CONFIG.conversionTimeoutMs,
  );

  return {
    concurrency: parsePositiveInteger(
      "WORKER_CONCURRENCY",
      getOptionalEnv("WORKER_CONCURRENCY", source),
      DEFAULT_WORKER_CONFIG.concurrency,
    ),
    conversionTimeoutMs,
    shutdownTimeoutMs: parsePositiveInteger(
      "WORKER_SHUTDOWN_TIMEOUT_MS",
      getOptionalEnv("WORKER_SHUTDOWN_TIMEOUT_MS", source),
      conversionTimeoutMs + 10_000,
    ),
    healthPort: parsePort(
      getOptionalEnv("PORT", source) === undefined
        ? "WORKER_HEALTH_PORT"
        : "PORT",
      getOptionalEnv("PORT", source) ??
        getOptionalEnv("WORKER_HEALTH_PORT", source),
      DEFAULT_WORKER_CONFIG.healthPort,
    ),
    maxInputFileSizeBytes: parsePositiveInteger(
      "MAX_INPUT_FILE_SIZE",
      getOptionalEnv("MAX_INPUT_FILE_SIZE", source),
      DEFAULT_WORKER_CONFIG.maxInputFileSizeBytes,
    ),
    maxOutputFileSizeBytes: parsePositiveInteger(
      "MAX_OUTPUT_FILE_SIZE",
      getOptionalEnv("MAX_OUTPUT_FILE_SIZE", source),
      DEFAULT_WORKER_CONFIG.maxOutputFileSizeBytes,
    ),
    maxTempDiskUsageBytes: parsePositiveInteger(
      "MAX_TEMP_DISK_USAGE",
      getOptionalEnv("MAX_TEMP_DISK_USAGE", source),
      DEFAULT_WORKER_CONFIG.maxTempDiskUsageBytes,
    ),
    libreOfficeBin: parseBinaryName(
      getOptionalEnv("LIBREOFFICE_BIN", source),
      DEFAULT_WORKER_CONFIG.libreOfficeBin,
    ),
    ghostscriptBin: parseBinaryName(
      getOptionalEnv("GHOSTSCRIPT_BIN", source),
      DEFAULT_WORKER_CONFIG.ghostscriptBin,
    ),
    pdftoppmBin: parseBinaryName(
      getOptionalEnv("PDFTOPPM_BIN", source),
      DEFAULT_WORKER_CONFIG.pdftoppmBin,
    ),
    pdftotextBin: parseBinaryName(
      getOptionalEnv("PDFTOTEXT_BIN", source),
      DEFAULT_WORKER_CONFIG.pdftotextBin,
    ),
  };
}
