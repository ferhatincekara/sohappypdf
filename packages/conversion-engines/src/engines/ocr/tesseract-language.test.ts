import { describe, expect, test } from "bun:test";
import { toTesseractLanguage } from "./tesseract-language.js";

describe("toTesseractLanguage", () => {
  test("keeps Tesseract codes unchanged", () => {
    expect(toTesseractLanguage("eng")).toBe("eng");
    expect(toTesseractLanguage("tur")).toBe("tur");
    expect(toTesseractLanguage("eng+tur")).toBe("eng+tur");
  });

  test("maps ISO 639-1 aliases used by the UI and API", () => {
    expect(toTesseractLanguage("en")).toBe("eng");
    expect(toTesseractLanguage("tr")).toBe("tur");
    expect(toTesseractLanguage("de")).toBe("deu");
    expect(toTesseractLanguage("fr")).toBe("fra");
    expect(toTesseractLanguage("es")).toBe("spa");
    expect(toTesseractLanguage("en-US")).toBe("eng");
  });
});
