import { describe, expect, test } from "bun:test";
import {
  healthResponse,
  startWorkerHealthServer,
  type WorkerHealthStatus,
} from "./health-server.js";

describe("worker health", () => {
  test("distinguishes liveness from readiness", () => {
    expect(healthResponse("/live", "GET", "starting")).toEqual({
      statusCode: 200,
      body: JSON.stringify({ status: "alive" }),
    });
    expect(healthResponse("/ready", "GET", "starting")).toEqual({
      statusCode: 503,
      body: JSON.stringify({ status: "starting" }),
    });
    expect(healthResponse("/health", "GET", "ready")).toEqual({
      statusCode: 200,
      body: JSON.stringify({ status: "ready" }),
    });
    expect(healthResponse("/ready", "GET", "shutting_down")).toEqual({
      statusCode: 503,
      body: JSON.stringify({ status: "shutting_down" }),
    });
  });

  test("does not expose internal details", () => {
    const ready = healthResponse("/ready", "GET", "ready");
    expect(ready?.body).not.toContain("DATABASE_URL");
    expect(ready?.body).not.toContain("token");
    expect(healthResponse("/secrets", "GET", "ready")).toBeUndefined();
  });

  test("serves live and ready over HTTP", async () => {
    let status: WorkerHealthStatus = "starting";
    const server = await startWorkerHealthServer({
      port: 0,
      host: "127.0.0.1",
      state: {
        getStatus() {
          return status;
        },
      },
    });

    try {
      const live = await fetch(`http://127.0.0.1:${server.port}/live`);
      const starting = await fetch(`http://127.0.0.1:${server.port}/ready`);
      status = "ready";
      const ready = await fetch(`http://127.0.0.1:${server.port}/ready`);

      expect(live.status).toBe(200);
      expect(starting.status).toBe(503);
      expect(ready.status).toBe(200);
      expect(await ready.json()).toEqual({ status: "ready" });
    } finally {
      await server.close();
    }
  });
});
