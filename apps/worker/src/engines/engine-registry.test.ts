import { describe, expect, test } from "bun:test";
import { DEFAULT_WORKER_CONFIG } from "@repo/config";
import { isPermanentConversionError } from "../job-errors.js";
import { createEngineRegistry } from "./engine-registry.js";

describe("engine registry", () => {
  const registry = createEngineRegistry(DEFAULT_WORKER_CONFIG);

  test("selects engines for the implemented first conversions", () => {
    expect(registry.resolve("pdf-to-word").name).toBe("office");
    expect(registry.resolve("pdf-to-jpg").name).toBe("pdf-image");
    expect(registry.resolve("pdf-to-png").name).toBe("pdf-image");
    expect(registry.resolve("pdf-to-txt").name).toBe("pdf-text");
    expect(registry.resolve("jpg-to-pdf").name).toBe("image-pdf");
    expect(registry.resolve("png-to-pdf").name).toBe("image-pdf");
    expect(registry.resolve("merge-pdf").name).toBe("pdf-manipulate");
    expect(registry.resolve("split-pdf").name).toBe("pdf-manipulate");
    expect(registry.resolve("compress-pdf").name).toBe("pdf-manipulate");
  });

  test("rejects conversions without an engine", () => {
    try {
      registry.resolve("ocr-pdf");
      throw new Error("expected unsupported conversion");
    } catch (error) {
      expect(isPermanentConversionError(error)).toBe(true);
    }
  });
});
