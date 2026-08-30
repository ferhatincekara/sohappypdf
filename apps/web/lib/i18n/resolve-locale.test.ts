import { describe, expect, test } from "bun:test";
import {
  parseAppLocale,
  resolveAppLocale,
  resolveLocaleFromAcceptLanguage,
} from "@/lib/i18n/resolve-locale";

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
      "de",
    );
    expect(resolveLocaleFromAcceptLanguage("pt-BR,pt;q=0.9,en;q=0.8")).toBe(
      "pt-BR",
    );
    expect(resolveLocaleFromAcceptLanguage("pt-PT,pt;q=0.9")).toBe("pt-BR");
    expect(resolveLocaleFromAcceptLanguage("ja,en;q=0.8")).toBe("ja");
  });

  test("falls back to English for unsupported languages", () => {
    expect(resolveLocaleFromAcceptLanguage("zh-CN,it;q=0.8")).toBe("en");
  });
});

describe("resolveAppLocale", () => {
  test("prefers a valid locale cookie over Accept-Language", () => {
    expect(
      resolveAppLocale({
        cookieLocale: "tr",
        acceptLanguage: "en-US,en;q=0.9",
      }),
    ).toBe("tr");
  });

  test("ignores an invalid locale cookie", () => {
    expect(parseAppLocale("zh")).toBeUndefined();
    expect(parseAppLocale("pt-br")).toBe("pt-BR");
    expect(
      resolveAppLocale({
        cookieLocale: "zh",
        acceptLanguage: "tr-TR,tr;q=0.9",
      }),
    ).toBe("tr");
  });
});
