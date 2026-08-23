import { spawn } from "node:child_process";
import process from "node:process";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import { PermanentConversionError } from "../job-errors.js";
import { assertPathInside } from "../temp/job-temp-directory.js";

const ALLOWED_BINARIES = new Set([
  "soffice",
  "libreoffice",
  "pdftoppm",
  "pdftotext",
  "gs",
]);

export type RunCommandInput = {
  command: string;
  args: readonly string[];
  cwd: string;
  timeoutMs: number;
};

function assertAllowedCommand(command: string): string {
  if (!ALLOWED_BINARIES.has(command)) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Unsupported conversion binary",
    });
  }

  return command;
}

export async function runChildProcess(input: {
  command: string;
  args: readonly string[];
  cwd: string;
  timeoutMs: number;
}): Promise<{ exitCode: number }> {
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
      env: {
        PATH: process.env.PATH,
        HOME: cwd,
        LANG: "C.UTF-8",
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let settled = false;
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!settled) {
          child.kill("SIGKILL");
        }
      }, 2_000);
      finish(
        new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Conversion timed out",
        }),
      );
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

      resolve({ exitCode: exitCode ?? 1 });
    };

    child.on("error", (error) => {
      finish(
        new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Conversion process failed",
          cause: error,
        }),
      );
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

  if (result.exitCode !== 0) {
    throw new PermanentConversionError(
      "processing_failed",
      "Conversion engine failed",
    );
  }
}
