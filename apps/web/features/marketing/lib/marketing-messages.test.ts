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

describe("marketing locales", () => {
  test("keeps English and Turkish marketing keys aligned", () => {
    const englishKeys = flattenKeys(en.marketing).sort();
    const turkishKeys = flattenKeys(tr.marketing).sort();

    expect(turkishKeys).toEqual(englishKeys);
    expect(englishKeys.some((key) => key.startsWith("hero."))).toBe(true);
    expect(englishKeys.some((key) => key.startsWith("pricing."))).toBe(true);
    expect(englishKeys.some((key) => key.startsWith("nav."))).toBe(true);
    expect(englishKeys.some((key) => key.startsWith("footer."))).toBe(true);
  });

  test("does not claim certifications or unlimited usage", () => {
    const copy = `${JSON.stringify(en.marketing)} ${JSON.stringify(tr.marketing)}`;

    expect(copy).not.toContain("SOC 2");
    expect(copy).not.toContain("HIPAA");
    expect(copy.toLowerCase()).not.toContain("unlimited");
    expect(copy.toLowerCase()).not.toContain("instant");
  });
});
