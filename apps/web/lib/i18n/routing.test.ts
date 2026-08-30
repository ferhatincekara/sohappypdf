import { describe, expect, test } from "bun:test";
import { LOCALE_COOKIE_NAME, routing } from "@/lib/i18n/routing";

describe("i18n routing", () => {
  test("keeps locales off the URL", () => {
    expect(routing.locales).toEqual([
      "en",
      "tr",
      "de",
      "es",
      "fr",
      "ja",
      "pt-BR",
    ]);
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localePrefix).toBe("never");
    expect(LOCALE_COOKIE_NAME).toBe("NEXT_LOCALE");
  });
});
