import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { loadAdminConfig } from "./admin-config.js";

describe("loadAdminConfig", () => {
  test("defaults to no bootstrap administrators", () => {
    expect(loadAdminConfig({})).toEqual({
      adminUrl: undefined,
      bootstrapUserIds: [],
      workerHealthUrl: undefined,
    });
  });

  test("parses admin origin and bootstrap user IDs", () => {
    expect(
      loadAdminConfig({
        ADMIN_URL: "https://admin.sohappypdf.com/",
        ADMIN_USER_IDS: "user_admin_1, 550e8400-e29b-41d4-a716-446655440000",
        WORKER_HEALTH_URL: "http://localhost:8080/ready",
      }),
    ).toEqual({
      adminUrl: "https://admin.sohappypdf.com",
      bootstrapUserIds: [
        "user_admin_1",
        "550e8400-e29b-41d4-a716-446655440000",
      ],
      workerHealthUrl: "http://localhost:8080",
    });
  });

  test("rejects invalid bootstrap identifiers", () => {
    try {
      loadAdminConfig({ ADMIN_USER_IDS: "not a valid id" });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFIGURATION_ERROR");
      }
    }
  });
});
