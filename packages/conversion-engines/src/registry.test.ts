import { describe, expect, test } from "bun:test";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "./engine-config.js";
import { isPermanentConversionError } from "./errors.js";
import { createEngineRegistry } from "./registry.js";

describe("engine registry", () => {
  const registry = createEngineRegistry(DEFAULT_CONVERSION_ENGINE_CONFIG);

  test("selects engines for the implemented first conversions", () => {
    expect(registry.resolve("pdf-to-word").name).toBe("office");
    expect(
      registry.resolve({
        type: "pdf-to-jpg",
        sourceFormat: "pdf",
        targetFormat: "jpg",
      }).name,
    ).toBe("pdf-image");
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

  test("rejects a type that does not match the requested formats", () => {
    try {
      registry.resolve({
        type: "pdf-to-jpg",
        sourceFormat: "pdf",
        targetFormat: "png",
      });
      throw new Error("expected unsupported conversion");
    } catch (error) {
      expect(isPermanentConversionError(error)).toBe(true);
    }
  });
});
