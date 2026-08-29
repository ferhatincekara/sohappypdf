import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { DEFAULT_WORKER_CONFIG, loadWorkerConfig } from "./worker-config.js";

describe("loadWorkerConfig", () => {
  test("uses conservative production defaults", () => {
    const config = loadWorkerConfig({});

    expect(config.concurrency).toBe(1);
    expect(config.conversionTimeoutMs).toBe(
      DEFAULT_WORKER_CONFIG.conversionTimeoutMs,
    );
    expect(config.shutdownTimeoutMs).toBe(
      DEFAULT_WORKER_CONFIG.conversionTimeoutMs + 10_000,
    );
    expect(config.healthPort).toBe(8080);
    expect(config.qpdfBin).toBe("qpdf");
  });

  test("loads custom qpdf binary path", () => {
    const config = loadWorkerConfig({ QPDF_BIN: "qpdf-custom" });
    expect(config.qpdfBin).toBe("qpdf-custom");
  });

  test("prefers Cloud Run PORT over WORKER_HEALTH_PORT", () => {
    const config = loadWorkerConfig({
      PORT: "8081",
      WORKER_HEALTH_PORT: "9090",
    });

    expect(config.healthPort).toBe(8081);
  });

  test("rejects invalid concurrency and ports", () => {
    try {
      loadWorkerConfig({ WORKER_CONCURRENCY: "0" });
      throw new Error("expected concurrency to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }

    try {
      loadWorkerConfig({ PORT: "70000" });
      throw new Error("expected port to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
