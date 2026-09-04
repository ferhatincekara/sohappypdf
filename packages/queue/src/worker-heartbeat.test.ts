import { describe, expect, test } from "bun:test";
import {
  createWorkerHeartbeatState,
  parseWorkerHeartbeat,
  resolveWorkerHeartbeatStatus,
} from "./worker-heartbeat.js";

describe("worker heartbeat", () => {
  test("classifies stale workers without inventing healthy ones", () => {
    const now = new Date("2026-01-01T00:01:00.000Z");

    expect(
      resolveWorkerHeartbeatStatus(new Date("2026-01-01T00:00:50.000Z"), now),
    ).toBe("healthy");
    expect(
      resolveWorkerHeartbeatStatus(new Date("2026-01-01T00:00:30.000Z"), now),
    ).toBe("warning");
    expect(
      resolveWorkerHeartbeatStatus(new Date("2026-01-01T00:00:00.000Z"), now),
    ).toBe("offline");
  });

  test("rejects malformed heartbeat payloads", () => {
    expect(parseWorkerHeartbeat({ id: "worker-1" })).toBeUndefined();
    expect(
      parseWorkerHeartbeat({
        id: "worker-1",
        hostname: "box",
        startedAt: "2026-01-01T00:00:00.000Z",
        lastSeenAt: "2026-01-01T00:00:10.000Z",
        queues: ["conversion"],
        processedCount: 2,
        failedCount: 1,
        currentJobId: "job-1",
      }),
    ).toEqual({
      id: "worker-1",
      hostname: "box",
      startedAt: "2026-01-01T00:00:00.000Z",
      lastSeenAt: "2026-01-01T00:00:10.000Z",
      queues: ["conversion"],
      processedCount: 2,
      failedCount: 1,
      currentJobId: "job-1",
    });
  });

  test("tracks processed and failed counts locally", () => {
    const state = createWorkerHeartbeatState({
      id: "worker-1",
      hostname: "box",
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      queues: ["conversion"],
    });

    state.markJobStarted("job-1");
    expect(state.snapshot().currentJobId).toBe("job-1");
    state.markJobCompleted();
    state.markJobFailed();

    const snapshot = state.snapshot();
    expect(snapshot.processedCount).toBe(1);
    expect(snapshot.failedCount).toBe(1);
    expect(snapshot.currentJobId).toBeNull();
  });
});
