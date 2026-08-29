import { describe, expect, test } from "bun:test";
import type { Logger } from "@sohappypdf/logger";
import { createApp } from "../app.js";
import { createOpenApiDocument } from "../public-contract/openapi.js";

const silentLogger: Logger = {
  level: "error",
  error() {},
  warn() {},
  info() {},
  debug() {},
  child() {
    return silentLogger;
  },
};

describe("OpenAPI route", () => {
  test("publishes the v1 contract without authentication", async () => {
    const app = createApp({
      config: { corsOrigins: [] },
      logger: silentLogger,
      resolveIdentity: async () => ({ kind: "anonymous" }),
    });
    const response = await app.request("/v1/openapi.json");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(createOpenApiDocument());
  });
});
