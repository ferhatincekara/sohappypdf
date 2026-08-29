import { describe, expect, test } from "bun:test";
import { DEFAULT_WORKER_CONFIG } from "@sohappypdf/config";
import { isAppError } from "@sohappypdf/core";
import { verifyWorkerEnvironment } from "./verify-environment.js";

describe("verifyWorkerEnvironment", () => {
  test("returns native binary probes when infrastructure is available", async () => {
    const report = await verifyWorkerEnvironment(DEFAULT_WORKER_CONFIG, {
      probeBinaries() {
        return [
          { command: "soffice", available: true, version: "LibreOffice 24.2" },
        ];
      },
      async pingDatabase() {},
      async pingQueue() {},
      async pingStorage() {},
    });

    expect(report.binaries).toEqual([
      { command: "soffice", available: true, version: "LibreOffice 24.2" },
    ]);
    expect(report.queueAvailable).toBe(true);
  });

  test("fails startup when a required binary is missing", async () => {
    try {
      await verifyWorkerEnvironment(DEFAULT_WORKER_CONFIG, {
        probeBinaries() {
          throw new Error("missing soffice");
        },
        async pingDatabase() {},
        async pingQueue() {},
        async pingStorage() {},
      });
      throw new Error("expected missing binary to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  test("starts without Redis when the queue is unavailable", async () => {
    const report = await verifyWorkerEnvironment(DEFAULT_WORKER_CONFIG, {
      probeBinaries() {
        return [{ command: "soffice", available: true }];
      },
      async pingDatabase() {},
      async pingQueue() {
        throw new Error("redis quota exceeded");
      },
      async pingStorage() {},
    });

    expect(report.queueAvailable).toBe(false);
    expect(report.binaries).toEqual([{ command: "soffice", available: true }]);
  });

  test("fails startup when infrastructure is unavailable", async () => {
    try {
      await verifyWorkerEnvironment(DEFAULT_WORKER_CONFIG, {
        probeBinaries() {
          return [{ command: "soffice", available: true }];
        },
        async pingDatabase() {
          throw new Error("database down");
        },
        async pingQueue() {},
        async pingStorage() {},
      });
      throw new Error("expected infrastructure failure");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("INTERNAL_ERROR");
        expect(error.message).toBe("Worker database is unavailable");
      }
    }
  });
});
