import { describe, expect, test } from "bun:test";
import { routing } from "./routing";

describe("i18n routing", () => {
  test("keeps locales off the URL", () => {
    expect(routing.locales).toEqual(["en", "tr"]);
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localePrefix).toBe("never");
  });
});
