import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { loadApiConfig } from "./api-config.js";

describe("loadApiConfig", () => {
  test("defaults to no CORS origins", () => {
    expect(loadApiConfig({})).toEqual({ corsOrigins: [] });
  });

  test("parses an explicit origin list", () => {
    expect(
      loadApiConfig({
        API_CORS_ORIGINS: "https://sohappypdf.com, http://localhost:3000/",
      }),
    ).toEqual({
      corsOrigins: ["https://sohappypdf.com", "http://localhost:3000"],
    });
  });

  test("rejects a wildcard origin", () => {
    try {
      loadApiConfig({ API_CORS_ORIGINS: "*" });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFIGURATION_ERROR");
      }
    }
  });
});
