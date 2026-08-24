import { describe, expect, test } from "bun:test";
import { editorRectToPdf, pdfRectToEditor } from "./page-coordinates";

describe("page coordinates", () => {
  test("converts editor top-left boxes to PDF bottom-left boxes", () => {
    expect(
      editorRectToPdf({
        x: 10,
        y: 20,
        width: 100,
        height: 40,
        pageHeight: 792,
      }),
    ).toEqual({ x: 10, y: 732, width: 100, height: 40 });
  });

  test("round-trips editor and PDF rectangles", () => {
    const editor = { x: 24, y: 80, width: 120, height: 48, pageHeight: 792 };
    expect(
      pdfRectToEditor({ ...editorRectToPdf(editor), pageHeight: 792 }),
    ).toEqual({
      x: 24,
      y: 80,
      width: 120,
      height: 48,
    });
  });
});
