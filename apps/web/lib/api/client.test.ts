import { describe, expect, test } from "bun:test";
import { createApiClient } from "@/lib/api/client";

describe("api client", () => {
  test("initializes a credentialed Axios instance for first-party API calls", () => {
    const client = createApiClient();

    expect(client.defaults.baseURL).toBeDefined();
    expect(client.defaults.withCredentials).toBe(true);
  });
});
