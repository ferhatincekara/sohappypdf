import { describe, expect, test } from "bun:test";
import en from "../../../messages/en.json";
import tr from "../../../messages/tr.json";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return prefix === "" ? [] : [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix === "" ? key : `${prefix}.${key}`),
  );
}

describe("billing locales", () => {
  test("keeps English and Turkish billing keys aligned", () => {
    const englishKeys = flattenKeys(en.billing).sort();
    const turkishKeys = flattenKeys(tr.billing).sort();

    expect(turkishKeys).toEqual(englishKeys);
    expect(englishKeys).toContain("sections.web");
    expect(englishKeys).toContain("sections.api");
    expect(englishKeys).toContain("sections.ai");
    expect(englishKeys).toContain("portalHint");
    expect(englishKeys).toContain("remaining");
    expect(englishKeys).toContain("usedOfLimit");
    expect(englishKeys).toContain("renewsOn");
    expect(englishKeys).toContain("ai.title");
  });
});
