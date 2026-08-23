import { describe, expect, test } from "bun:test";
import { createApiClient } from "./client";

describe("api client", () => {
  test("initializes a single Axios instance against the public API URL", () => {
    const client = createApiClient();

    expect(client.defaults.baseURL).toBeDefined();
    expect(client.defaults.withCredentials).toBe(true);
  });
});
