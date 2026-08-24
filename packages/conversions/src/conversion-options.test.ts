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
  test("accepts typed options for core pdf tools", () => {
    expect(parseConversionOptions("rotate-pdf", { degrees: 90 })).toEqual({
      type: "rotate-pdf",
      degrees: 90,
    });

    expect(
      parseConversionOptions("watermark-pdf", { text: "Draft", opacity: 0.4 }),
    ).toEqual({
      type: "watermark-pdf",
      text: "Draft",
      opacity: 0.4,
    });

    expect(
      parseConversionOptions("protect-pdf", { password: "secret" }),
    ).toEqual({
      type: "protect-pdf",
      password: "secret",
    });

    expect(parseConversionOptions("repair-pdf", undefined)).toEqual({
      type: "repair-pdf",
    });
  });

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

  test("accepts office OCR conversion options", () => {
    expect(
      parseConversionOptions("pdf-to-word-ocr", { language: "eng" }),
    ).toEqual({
      type: "pdf-to-word-ocr",
      language: "eng",
    });

    expect(parseConversionOptions("pdf-to-excel-ocr", undefined)).toEqual({
      type: "pdf-to-excel-ocr",
      language: "eng",
    });
  });

  test("accepts advanced pdf tool options", () => {
    expect(
      parseConversionOptions("edit-pdf", {
        operations: [
          { kind: "text", page: 1, x: 10, y: 20, text: "Hello" },
        ],
      }),
    ).toEqual({
      type: "edit-pdf",
      operations: [{ kind: "text", page: 1, x: 10, y: 20, text: "Hello" }],
    });

    expect(
      parseConversionOptions("redact-pdf", {
        regions: [{ page: 1, x: 0, y: 0, width: 10, height: 10 }],
      }),
    ).toMatchObject({ type: "redact-pdf" });

    expect(
      parseConversionOptions("compare-pdf", {
        additionalFileIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
      }),
    ).toEqual({
      type: "compare-pdf",
      additionalFileIds: ["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"],
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
      parseConversionOptions("protect-pdf", undefined),
    );
    expectInvalidOptions(() =>
      parseConversionOptions("pdf-to-word", { password: "secret" }),
    );
  });
});
