import { type ChildProcess, spawn } from "node:child_process";
import process from "node:process";
import type { Readable } from "node:stream";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import { CONVERSION_NATIVE_BINARIES } from "../engine-config.js";
import { conversionTimeoutError, nativeToolFailureError } from "../errors.js";
import {
  assertPathInside,
  getSafeConversionTempDir,
} from "../workspace/temp-workspace.js";

const MAX_PROCESS_OUTPUT_BYTES = 8 * 1024;

export type RunCommandInput = {
  command: string;
  args: readonly string[];
  cwd: string;
  timeoutMs: number;
};

export type RunProcessResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type RunAllowedCommand = (input: RunCommandInput) => Promise<void>;

const ALLOWED_BINARIES = new Set<string>(CONVERSION_NATIVE_BINARIES);

/**
 * Minimal env for native converters. Preserve TMPDIR so tools like
 * ocrmypdf/tesseract can use the OS temp area (required on macOS).
 */
export function buildConversionProcessEnv(
  homeDirectory: string,
): NodeJS.ProcessEnv {
  const tempDir = getSafeConversionTempDir();
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: homeDirectory,
    LANG: process.env.LANG ?? "C.UTF-8",
    TMPDIR: tempDir,
    TMP: tempDir,
    TEMP: tempDir,
  };

  for (const key of ["TESSDATA_PREFIX", "LC_ALL", "LC_CTYPE"] as const) {
    const value = process.env[key];
    if (value !== undefined && value.length > 0) {
      env[key] = value;
    }
  }

  return env;
}

function assertAllowedCommand(command: string): string {
  if (!ALLOWED_BINARIES.has(command)) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Unsupported conversion binary",
    });
  }

  return command;
}

function collectLimitedOutput(
  stream: Readable,
  maxBytes: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    stream.on("data", (chunk: Buffer | string) => {
      if (size >= maxBytes) {
        return;
      }

      const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      const remaining = maxBytes - size;
      chunks.push(buffer.subarray(0, remaining));
      size += Math.min(buffer.byteLength, remaining);
    });
    stream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    stream.on("error", reject);
  });
}

function terminateChild(child: ChildProcess): void {
  child.kill("SIGTERM");
  setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
  }, 2_000);
}

export async function runChildProcess(input: {
  command: string;
  args: readonly string[];
  cwd: string;
  timeoutMs: number;
}): Promise<RunProcessResult> {
  const cwd = assertPathInside(input.cwd, input.cwd);

  if (!Number.isInteger(input.timeoutMs) || input.timeoutMs < 1) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid conversion timeout",
    });
  }

  return new Promise((resolve, reject) => {
    const child = spawn(input.command, [...input.args], {
      cwd,
      env: buildConversionProcessEnv(cwd),
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let settled = false;
    const stdout = collectLimitedOutput(child.stdout, MAX_PROCESS_OUTPUT_BYTES);
    const stderr = collectLimitedOutput(child.stderr, MAX_PROCESS_OUTPUT_BYTES);
    const timeout = setTimeout(() => {
      terminateChild(child);
      finish(conversionTimeoutError());
    }, input.timeoutMs);

    const finish = (error: Error | undefined, exitCode?: number): void => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);

      if (error !== undefined) {
        reject(error);
        return;
      }

      void Promise.all([stdout, stderr])
        .then(([stdoutText, stderrText]) => {
          resolve({
            exitCode: exitCode ?? 1,
            stdout: stdoutText,
            stderr: stderrText,
          });
        })
        .catch(() => {
          resolve({
            exitCode: exitCode ?? 1,
            stdout: "",
            stderr: "",
          });
        });
    };

    child.on("error", (error) => {
      finish(nativeToolFailureError(error.message));
    });

    child.on("close", (code) => {
      finish(undefined, code ?? 1);
    });
  });
}

export async function runAllowedCommand(input: RunCommandInput): Promise<void> {
  const command = assertAllowedCommand(input.command);
  const result = await runChildProcess({
    command,
    args: input.args,
    cwd: input.cwd,
    timeoutMs: input.timeoutMs,
  });

  if (result.exitCode !== 0 || hasLibreOfficeExportFilterError(result.stderr)) {
    const details = `${command} exited ${String(result.exitCode)}: ${result.stderr
      .trim()
      .slice(0, 800)}`;
    throw nativeToolFailureError(details);
  }
}

function hasLibreOfficeExportFilterError(stderr: string): boolean {
  return stderr.toLowerCase().includes("no export filter");
}
