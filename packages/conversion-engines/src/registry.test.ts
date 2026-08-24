import { describe, expect, test } from "bun:test";
import { DEFAULT_CONVERSION_ENGINE_CONFIG } from "./engine-config.js";
import { isPermanentConversionError } from "./errors.js";
import { createEngineRegistry } from "./registry.js";

describe("engine registry", () => {
  const registry = createEngineRegistry(DEFAULT_CONVERSION_ENGINE_CONFIG);

  test("selects engines for the implemented first conversions", () => {
    expect(registry.resolve("pdf-to-word").name).toBe("office");
    expect(registry.resolve("pdf-to-excel").name).toBe("office");
    expect(registry.resolve("pdf-to-powerpoint").name).toBe("office");
    expect(registry.resolve("word-to-pdf").name).toBe("office");
    expect(registry.resolve("excel-to-pdf").name).toBe("office");
    expect(registry.resolve("powerpoint-to-pdf").name).toBe("office");
    expect(registry.resolve("office-to-pdf").name).toBe("office");
    expect(registry.resolve("pdf-to-word-ocr").name).toBe("office-ocr");
    expect(registry.resolve("pdf-to-excel-ocr").name).toBe("office-ocr");
    expect(registry.resolve("ocr-pdf").name).toBe("ocr");
    expect(registry.resolve("ai-summarizer").name).toBe("ai");
    expect(registry.resolve("translate-pdf").name).toBe("ai");
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
    expect(registry.resolve("scan-to-pdf").name).toBe("image-pdf");
    expect(registry.resolve("merge-pdf").name).toBe("pdf-manipulate");
    expect(registry.resolve("split-pdf").name).toBe("pdf-manipulate");
    expect(registry.resolve("extract-pages").name).toBe("pdf-manipulate");
    expect(registry.resolve("compress-pdf").name).toBe("pdf-manipulate");
    expect(registry.resolve("rotate-pdf").name).toBe("pdf-manipulate");
    expect(registry.resolve("organize-pdf").name).toBe("pdf-manipulate");
    expect(registry.resolve("remove-pages").name).toBe("pdf-manipulate");
    expect(registry.resolve("reorder-pages").name).toBe("pdf-manipulate");
    expect(registry.resolve("crop-pdf").name).toBe("pdf-manipulate");
    expect(registry.resolve("watermark-pdf").name).toBe("pdf-edit");
    expect(registry.resolve("page-numbers-pdf").name).toBe("pdf-edit");
    expect(registry.resolve("edit-pdf").name).toBe("pdf-edit");
    expect(registry.resolve("sign-pdf").name).toBe("pdf-edit");
    expect(registry.resolve("protect-pdf").name).toBe("pdf-security");
    expect(registry.resolve("unlock-pdf").name).toBe("pdf-security");
    expect(registry.resolve("repair-pdf").name).toBe("pdf-repair");
    expect(registry.resolve("pdf-to-pdfa").name).toBe("pdf-pdfa");
    expect(registry.resolve("redact-pdf").name).toBe("pdf-redact");
    expect(registry.resolve("compare-pdf").name).toBe("pdf-compare");
    expect(registry.resolve("pdf-forms").name).toBe("pdf-forms");
    expect(registry.resolve("pdf-extract").name).toBe("pdf-extract");
    expect(registry.resolve("pdf-to-markdown").name).toBe("pdf-markdown");
  });

  test("rejects conversions without an engine", () => {
    try {
      registry.resolve("ocr-image");
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
