import { describe, expect, test } from "bun:test";
import {
  getBrowserApiBaseUrl,
  getPublicApiV1BaseUrl,
  getPublicWebEnv,
  getServerApiBaseUrl,
  getServerApiV1BaseUrl,
  toServerApiBaseUrl,
} from "@/config/public-env";

describe("getPublicWebEnv", () => {
  test("exposes only browser-safe public URLs", () => {
    const env = getPublicWebEnv();

    expect(env.appUrl.startsWith("http")).toBe(true);
    expect(env.apiBaseUrl.startsWith("http")).toBe(true);
    expect(env.maxUploadFileSizeBytes).toBeGreaterThan(0);
    expect(env).not.toHaveProperty("databaseUrl");
    expect(env).not.toHaveProperty("secret");
    expect(env).not.toHaveProperty("awsAccessKeyId");
    expect(env).not.toHaveProperty("s3BucketName");
  });

  test("uses the server API origin from Node and same-origin in the browser", () => {
    expect(getBrowserApiBaseUrl()).toBe(getServerApiBaseUrl());
  });

  test("derives the public v1 API base from the API origin", () => {
    expect(getPublicApiV1BaseUrl()).toBe(`${getPublicWebEnv().apiBaseUrl}/v1`);
    expect(getPublicApiV1BaseUrl()).not.toContain("YOUR_API_KEY");
  });

  test("rewrites localhost to 127.0.0.1 for server-to-server fetches", () => {
    expect(toServerApiBaseUrl("http://localhost:3001")).toBe(
      "http://127.0.0.1:3001",
    );
    expect(toServerApiBaseUrl("http://localhost:3001/")).toBe(
      "http://127.0.0.1:3001",
    );
    expect(toServerApiBaseUrl("https://api.sohappypdf.com")).toBe(
      "https://api.sohappypdf.com",
    );
    expect(getServerApiV1BaseUrl()).toBe(
      `${toServerApiBaseUrl(getPublicWebEnv().apiBaseUrl)}/v1`,
    );
  });
});
