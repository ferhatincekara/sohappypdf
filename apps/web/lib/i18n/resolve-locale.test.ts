import { describe, expect, test } from "bun:test";
import { resolveLocaleFromAcceptLanguage } from "./resolve-locale";

describe("resolveLocaleFromAcceptLanguage", () => {
  test("defaults to English when the header is missing", () => {
    expect(resolveLocaleFromAcceptLanguage(undefined)).toBe("en");
    expect(resolveLocaleFromAcceptLanguage(null)).toBe("en");
    expect(resolveLocaleFromAcceptLanguage("")).toBe("en");
  });

  test("selects the highest quality supported language", () => {
    expect(resolveLocaleFromAcceptLanguage("tr-TR,tr;q=0.9,en;q=0.8")).toBe(
      "tr",
    );
    expect(resolveLocaleFromAcceptLanguage("en-US,en;q=0.9,tr;q=0.8")).toBe(
      "en",
    );
    expect(resolveLocaleFromAcceptLanguage("de-DE,de;q=0.9,tr;q=0.8")).toBe(
      "tr",
    );
  });

  test("falls back to English for unsupported languages", () => {
    expect(resolveLocaleFromAcceptLanguage("de-DE,fr;q=0.8")).toBe("en");
  });
});
