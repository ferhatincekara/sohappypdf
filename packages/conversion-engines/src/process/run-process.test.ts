import { describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { isAppError } from "@repo/core";
import { isPermanentConversionError } from "../errors.js";
import { runAllowedCommand, runChildProcess } from "./run-process.js";

describe("command execution", () => {
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
