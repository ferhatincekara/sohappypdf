import { describe, expect, test } from "bun:test";
import {
  clampFontSizePt,
  resolvePdfFont,
  sanitizeCssColor,
} from "./pdf-font-style.js";

describe("pdf font style", () => {
  test("maps subset PDF names to Word-safe families and weight", () => {
    expect(resolvePdfFont("ABCDEF+TimesNewRomanPS-BoldMT")).toEqual({
      fontFamily: "Times New Roman",
      bold: true,
      italic: false,
    });
    expect(resolvePdfFont("Helvetica-Oblique")).toEqual({
      fontFamily: "Arial",
      bold: false,
      italic: true,
    });
    expect(resolvePdfFont("Calibri")).toEqual({
      fontFamily: "Calibri",
      bold: false,
      italic: false,
    });
  });

  test("rejects unsafe colors and empty sizes", () => {
    expect(sanitizeCssColor("#112233")).toBe("#112233");
    expect(sanitizeCssColor("red")).toBe("#000000");
    expect(sanitizeCssColor("#fff")).toBe("#000000");
    expect(clampFontSizePt(12.34)).toBe(12.3);
    expect(clampFontSizePt(0)).toBe(11);
    expect(clampFontSizePt(400)).toBe(96);
  });
});
