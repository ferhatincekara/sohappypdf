import { describe, expect, test } from "bun:test";
import { DEFAULT_WORKER_CONFIG } from "@repo/config";
import { isAppError } from "@repo/core";
import { verifyWorkerEnvironment } from "./verify-environment.js";

describe("verifyWorkerEnvironment", () => {
  test("returns native binary probes when infrastructure is available", async () => {
    const probes = await verifyWorkerEnvironment(DEFAULT_WORKER_CONFIG, {
      probeBinaries() {
        return [
          { command: "soffice", available: true, version: "LibreOffice 24.2" },
        ];
      },
      async pingDatabase() {},
      async pingQueue() {},
      async pingStorage() {},
    });

    expect(probes).toEqual([
      { command: "soffice", available: true, version: "LibreOffice 24.2" },
    ]);
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
