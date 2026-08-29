import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { createQueueConnectionOptions } from "./queue-connection.js";

const config = {
  restUrl: "https://example-123.upstash.io",
  restToken: "upstash-test-token",
};

describe("queue connection", () => {
  test("derives a TLS Redis connection from the Upstash REST URL and token", () => {
    const connection = createQueueConnectionOptions(config, "producer");

    expect(connection.host).toBe("example-123.upstash.io");
    expect(connection.port).toBe(6379);
    expect(connection.username).toBe("default");
    expect(connection.password).toBe(config.restToken);
    expect(connection.tls).toEqual({});
    expect(connection.family).toBe(4);
    expect(connection.connectTimeout).toBe(10_000);
    expect(connection.maxRetriesPerRequest).toBe(20);
    expect(connection.enableReadyCheck).toBe(false);
  });

  test("uses blocking-safe retries for worker connections", () => {
    const connection = createQueueConnectionOptions(config, "worker");
    expect(connection.maxRetriesPerRequest).toBeNull();
  });

  test("rejects invalid REST URLs without using Redis", () => {
    try {
      createQueueConnectionOptions({
        restUrl: "http://localhost:6379",
        restToken: "token",
      });
      throw new Error("expected configuration to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("CONFIGURATION_ERROR");
      }
    }
  });
});

describe("closeQueueConnections", () => {
  test("is a no-op when no Redis connections were created", async () => {
    const { closeQueueConnections } = await import("./queue-connection.js");
    await closeQueueConnections();
  });
});
