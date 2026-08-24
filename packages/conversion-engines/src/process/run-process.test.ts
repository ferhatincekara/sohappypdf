import { describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { isAppError } from "@repo/core";
import { isPermanentConversionError } from "../errors.js";
import { getSafeConversionTempDir } from "../workspace/temp-workspace.js";
import {
  buildConversionProcessEnv,
  runAllowedCommand,
  runChildProcess,
} from "./run-process.js";

describe("command execution", () => {
  test("preserves a safe TMPDIR for native converter processes", () => {
    const env = buildConversionProcessEnv("/tmp/job");
    expect(env.HOME).toBe("/tmp/job");
    expect(env.TMPDIR).toBe(getSafeConversionTempDir());
    expect(env.PATH).toBe(process.env.PATH);
  });

  test("does not point TMPDIR at macOS /tmp", () => {
    const previous = process.env.TMPDIR;
    process.env.TMPDIR = "/tmp";

    try {
      const env = buildConversionProcessEnv("/tmp/job");
      if (process.platform === "darwin") {
        expect(env.TMPDIR).not.toBe("/tmp");
        expect(env.TMPDIR?.startsWith("/private/tmp")).toBe(false);
      }
    } finally {
      if (previous === undefined) {
        delete process.env.TMPDIR;
      } else {
        process.env.TMPDIR = previous;
      }
    }
  });

  test("times out a long-running process", async () => {
    try {
      await runChildProcess({
        command: process.execPath,
        args: [
          "-e",
          "Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000)",
        ],
        cwd: tmpdir(),
        timeoutMs: 50,
      });
      throw new Error("expected timeout");
    } catch (error) {
      expect(isPermanentConversionError(error)).toBe(true);
      if (isPermanentConversionError(error)) {
        expect(error.message).toBe("Conversion timed out");
      }
    }
  });

  test("rejects binaries that are not on the conversion allowlist", async () => {
    try {
      await runAllowedCommand({
        command: "bash",
        args: ["-c", "echo pwned"],
        cwd: tmpdir(),
        timeoutMs: 1_000,
      });
      throw new Error("expected disallowed binary");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });

  test("treats a non-zero exit as a permanent engine failure", async () => {
    try {
      await runAllowedCommand({
        command: "pdftoppm",
        args: ["--not-a-real-flag"],
        cwd: tmpdir(),
        timeoutMs: 1_000,
      });
      throw new Error("expected process failure");
    } catch (error) {
      expect(isPermanentConversionError(error)).toBe(true);
    }
  });
});
