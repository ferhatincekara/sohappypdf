import { describe, expect, test } from "bun:test";
import { getPublicWebEnv } from "./public-env";

describe("getPublicWebEnv", () => {
  test("exposes only browser-safe public URLs", () => {
    const env = getPublicWebEnv();

    expect(env.appUrl.startsWith("http")).toBe(true);
    expect(env.apiBaseUrl.startsWith("http")).toBe(true);
    expect(env).not.toHaveProperty("databaseUrl");
    expect(env).not.toHaveProperty("secret");
  });
});
