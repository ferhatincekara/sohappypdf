import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import { parseConversionOptions } from "./conversion-options.js";

function expectInvalidOptions(run: () => unknown): void {
  try {
    run();
    throw new Error("expected options to fail");
  } catch (error) {
    expect(isAppError(error)).toBe(true);
    if (isAppError(error)) {
      expect(error.code).toBe("VALIDATION_ERROR");
    }
  }
}

describe("conversion options", () => {
  test("accepts typed options for image and compression conversions", () => {
    expect(
      parseConversionOptions("pdf-to-jpg", {
        page: 2,
        quality: 80,
        dpi: 150,
      }),
    ).toEqual({
      type: "pdf-to-jpg",
      page: 2,
      quality: 80,
      dpi: 150,
    });

    expect(parseConversionOptions("compress-pdf", undefined)).toEqual({
      type: "compress-pdf",
      level: "medium",
    });
  });

  test("defaults OCR output mode from the target format", () => {
    expect(
      parseConversionOptions(
        "ocr-pdf",
        { language: "deu" },
        { targetFormat: "txt" },
      ),
    ).toEqual({
      type: "ocr-pdf",
      language: "deu",
      outputMode: "txt",
    });
  });

  test("rejects invalid or sensitive options", () => {
    expectInvalidOptions(() =>
      parseConversionOptions("pdf-to-jpg", { quality: 250 }),
    );
    expectInvalidOptions(() =>
      parseConversionOptions("pdf-to-png", { dpi: 12 }),
    );
    expectInvalidOptions(() => parseConversionOptions("rotate-pdf", undefined));
    expectInvalidOptions(() => parseConversionOptions("merge-pdf", undefined));
    expectInvalidOptions(() =>
      parseConversionOptions("protect-pdf", { password: "secret" }),
    );
    expectInvalidOptions(() =>
      parseConversionOptions("pdf-to-word", { quality: 80 }),
    );
  });
});
