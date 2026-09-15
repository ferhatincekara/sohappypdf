import { describe, expect, test } from "bun:test";
import { billingRecordsHealth, workerHttpHealth } from "./system.ts";

describe("billingRecordsHealth", () => {
  test("treats readable local records as healthy without Polar credentials", () => {
    expect(billingRecordsHealth({ ok: true, latencyMs: 12 })).toEqual({
      name: "Billing",
      status: "healthy",
      latencyMs: 12,
      detail:
        "Local subscription records are readable. Polar checkout and webhooks run on the API.",
    });
  });

  test("marks billing unavailable when records cannot be read", () => {
    expect(billingRecordsHealth({ ok: false, latencyMs: 8 })).toEqual({
      name: "Billing",
      status: "unavailable",
      latencyMs: 8,
      detail: "Unable to read local billing records.",
    });
  });
});

describe("workerHttpHealth", () => {
  test("omits the card when the worker health URL is not configured", () => {
    expect(
      workerHttpHealth({
        configured: false,
        ok: false,
        latencyMs: null,
      }),
    ).toBeNull();
  });

  test("reports healthy when the configured endpoint responds", () => {
    expect(
      workerHttpHealth({
        configured: true,
        ok: true,
        latencyMs: 20,
      }),
    ).toEqual({
      name: "Worker HTTP",
      status: "healthy",
      latencyMs: 20,
      detail: "Configured worker endpoint is ready.",
    });
  });

  test("reports unavailable when the configured endpoint fails", () => {
    expect(
      workerHttpHealth({
        configured: true,
        ok: false,
        latencyMs: 40,
      }),
    ).toEqual({
      name: "Worker HTTP",
      status: "unavailable",
      latencyMs: 40,
      detail: "Configured worker endpoint is not ready.",
    });
  });
});
