import { describe, expect, test } from "bun:test";
import { createLogger } from "@sohappypdf/logger";
import { createWorkerShutdown } from "./shutdown.js";

describe("worker shutdown", () => {
  test("waits for the active worker to close before exiting", async () => {
    const order: string[] = [];
    const shutdown = createWorkerShutdown({
      async closeWorker() {
        order.push("worker");
      },
      async closeHealth() {
        order.push("health");
      },
      async closeQueue() {
        order.push("queue");
      },
      timeoutMs: 1_000,
      logger: createLogger({ level: "error" }),
    });

    const code = await shutdown.shutdown("SIGTERM");
    expect(code).toBe(0);
    expect(order).toEqual(["worker", "health", "queue"]);
    expect(shutdown.isShuttingDown()).toBe(true);
  });

  test("force-closes when graceful shutdown exceeds the timeout", async () => {
    const closes: boolean[] = [];
    const shutdown = createWorkerShutdown({
      closeWorker(force) {
        closes.push(force === true);
        if (force !== true) {
          return new Promise(() => undefined);
        }

        return Promise.resolve();
      },
      async closeHealth() {},
      async closeQueue() {},
      timeoutMs: 20,
      logger: createLogger({ level: "error" }),
    });

    const code = await shutdown.shutdown("SIGTERM");
    expect(code).toBe(1);
    expect(closes).toEqual([false, true]);
  });

  test("does not start a second shutdown", async () => {
    let closeCount = 0;
    const shutdown = createWorkerShutdown({
      async closeWorker() {
        closeCount += 1;
      },
      async closeHealth() {},
      async closeQueue() {},
      timeoutMs: 1_000,
      logger: createLogger({ level: "error" }),
    });

    const first = shutdown.shutdown("SIGTERM");
    const second = shutdown.shutdown("SIGINT");
    expect(first).toBe(second);
    await first;
    expect(closeCount).toBe(1);
  });
});
