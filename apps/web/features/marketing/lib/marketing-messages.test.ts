import { describe, expect, test } from "bun:test";
import { listCatalogTools } from "@repo/tools/catalog";
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
    expect(englishKeys.some((key) => key.startsWith("about."))).toBe(true);
    expect(englishKeys.some((key) => key.startsWith("contact."))).toBe(true);
    expect(englishKeys.some((key) => key.startsWith("toolsDirectory."))).toBe(
      true,
    );
  });

  test("keeps English and Turkish developerDocs keys aligned", () => {
    expect(flattenKeys(tr.developerDocs).sort()).toEqual(
      flattenKeys(en.developerDocs).sort(),
    );
  });

  test("keeps English and Turkish blog chrome keys aligned", () => {
    expect(flattenKeys(tr.blog).sort()).toEqual(flattenKeys(en.blog).sort());
  });

  test("keeps English and Turkish legal keys aligned", () => {
    expect(flattenKeys(tr.legal).sort()).toEqual(flattenKeys(en.legal).sort());
  });

  test("keeps English and Turkish publicTools keys aligned", () => {
    expect(flattenKeys(tr.publicTools).sort()).toEqual(
      flattenKeys(en.publicTools).sort(),
    );
  });

  test("keeps English and Turkish tool catalog copy aligned", () => {
    expect(flattenKeys(tr.tools).sort()).toEqual(flattenKeys(en.tools).sort());
  });

  test("does not claim certifications or instant processing", () => {
    const copy = `${JSON.stringify(en.marketing)} ${JSON.stringify(tr.marketing)} ${JSON.stringify(en.publicTools)} ${JSON.stringify(tr.publicTools)} ${JSON.stringify(en.blog)} ${JSON.stringify(tr.blog)} ${JSON.stringify(en.legal)} ${JSON.stringify(tr.legal)}`;

    expect(copy).not.toContain("SOC 2");
    expect(copy).not.toContain("HIPAA");
    expect(copy.toLowerCase()).not.toContain("instant");
  });

  test("has unique English tool names", () => {
    const names = listCatalogTools().map(
      (tool) => en.tools[tool.id as keyof typeof en.tools].name,
    );

    expect(new Set(names).size).toBe(names.length);
  });

  test("has name and description copy for every catalog tool in both locales", () => {
    for (const tool of listCatalogTools()) {
      const english = en.tools[tool.id as keyof typeof en.tools];
      const turkish = tr.tools[tool.id as keyof typeof tr.tools];

      expect(english.name.length).toBeGreaterThan(0);
      expect(english.description.length).toBeGreaterThan(0);
      expect(turkish.name.length).toBeGreaterThan(0);
      expect(turkish.description.length).toBeGreaterThan(0);
    }
  });
});
