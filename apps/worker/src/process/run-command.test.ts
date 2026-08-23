import { describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { isAppError } from "@repo/core";
import { runChildProcess } from "./run-command.js";

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
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.message).toBe("Conversion timed out");
      }
    }
  });
});
