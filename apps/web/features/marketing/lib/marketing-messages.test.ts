import { describe, expect, test } from "bun:test";
import { listCatalogTools } from "@sohappypdf/tools/catalog";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import ja from "@/messages/ja.json";
import ptBR from "@/messages/pt-BR.json";
import tr from "@/messages/tr.json";

const catalogs = { en, tr, de, es, fr, ja, "pt-BR": ptBR } as const;

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return prefix === "" ? [] : [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix === "" ? key : `${prefix}.${key}`),
  );
}

describe("marketing locales", () => {
  test("keeps the full message catalog aligned across locales", () => {
    const englishKeys = flattenKeys(en).sort();

    for (const [locale, catalog] of Object.entries(catalogs)) {
      if (locale === "en") {
        continue;
      }

      expect(flattenKeys(catalog).sort()).toEqual(englishKeys);
    }
  });

  test("keeps marketing keys aligned across locales", () => {
    const englishKeys = flattenKeys(en.marketing).sort();

    for (const [locale, catalog] of Object.entries(catalogs)) {
      if (locale === "en") {
        continue;
      }

      expect(flattenKeys(catalog.marketing).sort(), locale).toEqual(
        englishKeys,
      );
    }

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

  test("keeps developerDocs keys aligned across locales", () => {
    const englishKeys = flattenKeys(en.developerDocs).sort();

    for (const [locale, catalog] of Object.entries(catalogs)) {
      if (locale === "en") {
        continue;
      }

      expect(flattenKeys(catalog.developerDocs).sort(), locale).toEqual(
        englishKeys,
      );
    }
  });

  test("keeps blog chrome keys aligned across locales", () => {
    const englishKeys = flattenKeys(en.blog).sort();

    for (const [locale, catalog] of Object.entries(catalogs)) {
      if (locale === "en") {
        continue;
      }

      expect(flattenKeys(catalog.blog).sort(), locale).toEqual(englishKeys);
    }
  });

  test("keeps legal keys aligned across locales", () => {
    const englishKeys = flattenKeys(en.legal).sort();

    for (const [locale, catalog] of Object.entries(catalogs)) {
      if (locale === "en") {
        continue;
      }

      expect(flattenKeys(catalog.legal).sort(), locale).toEqual(englishKeys);
    }
  });

  test("keeps publicTools keys aligned across locales", () => {
    const englishKeys = flattenKeys(en.publicTools).sort();

    for (const [locale, catalog] of Object.entries(catalogs)) {
      if (locale === "en") {
        continue;
      }

      expect(flattenKeys(catalog.publicTools).sort(), locale).toEqual(
        englishKeys,
      );
    }
  });

  test("keeps tool catalog copy aligned across locales", () => {
    const englishKeys = flattenKeys(en.tools).sort();

    for (const [locale, catalog] of Object.entries(catalogs)) {
      if (locale === "en") {
        continue;
      }

      expect(flattenKeys(catalog.tools).sort(), locale).toEqual(englishKeys);
    }
  });

  test("does not claim certifications or instant processing", () => {
    const allCopy = Object.values(catalogs)
      .flatMap((catalog) => [
        catalog.marketing,
        catalog.publicTools,
        catalog.blog,
        catalog.legal,
      ])
      .map((section) => JSON.stringify(section))
      .join(" ");
    const englishCopy = `${JSON.stringify(en.marketing)} ${JSON.stringify(en.publicTools)} ${JSON.stringify(en.blog)} ${JSON.stringify(en.legal)} ${JSON.stringify(tr.marketing)} ${JSON.stringify(tr.publicTools)} ${JSON.stringify(tr.blog)} ${JSON.stringify(tr.legal)}`;

    expect(allCopy).not.toContain("SOC 2");
    expect(allCopy).not.toContain("HIPAA");
    expect(englishCopy.toLowerCase()).not.toContain("instant");
  });

  test("has unique English tool names", () => {
    const names = listCatalogTools().map(
      (tool) => en.tools[tool.id as keyof typeof en.tools].name,
    );

    expect(new Set(names).size).toBe(names.length);
  });

  test("has name and description copy for every catalog tool in every locale", () => {
    for (const tool of listCatalogTools()) {
      for (const [locale, catalog] of Object.entries(catalogs)) {
        const copy = catalog.tools[tool.id as keyof typeof catalog.tools];

        expect(copy.name.length, `${locale}:${tool.id}.name`).toBeGreaterThan(
          0,
        );
        expect(
          copy.metaTitle.length,
          `${locale}:${tool.id}.metaTitle`,
        ).toBeGreaterThan(0);
        expect(
          copy.description.length,
          `${locale}:${tool.id}.description`,
        ).toBeGreaterThan(0);
      }
    }
  });

  test("has unique English tool meta titles", () => {
    const titles = listCatalogTools().map(
      (tool) => en.tools[tool.id as keyof typeof en.tools].metaTitle,
    );

    expect(new Set(titles).size).toBe(titles.length);
  });
});
