import { describe, expect, test } from "bun:test";
import { listRegisteredTools } from "@sohappypdf/tools/catalog";
import { PUBLIC_TOOL_ERROR_KEYS } from "@/features/public-tools/lib/public-tool-errors";
import { listPublicToolRouteParams } from "@/features/public-tools/lib/public-tool-routes";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import ja from "@/messages/ja.json";
import ptBR from "@/messages/pt-BR.json";
import tr from "@/messages/tr.json";

const catalogs = { en, tr, de, es, fr, ja, "pt-BR": ptBR } as const;

describe("public product coverage", () => {
  test("localizes every public tool error key in every locale", () => {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      const errors = catalog.publicTools.errors;

      for (const key of PUBLIC_TOOL_ERROR_KEYS) {
        expect(errors[key].length, `${locale}:${key}`).toBeGreaterThan(0);
      }

      expect(errors.tooManyPagesShort.length, locale).toBeGreaterThan(0);
      expect(errors.upgradeTitle.length, locale).toBeGreaterThan(0);
    }

    for (const key of PUBLIC_TOOL_ERROR_KEYS) {
      expect(en.publicTools.errors[key]).not.toContain("ECONNREFUSED");
      expect(en.publicTools.errors[key]).not.toContain("AccessDenied");
      expect(en.publicTools.errors[key]).not.toMatch(/s3/i);
    }
  });

  test("exposes a public page for every executable tool", () => {
    const registered = listRegisteredTools()
      .map((tool) => tool.id)
      .sort();
    const routed = listPublicToolRouteParams()
      .map((item) => item.toolId)
      .sort();

    expect(routed).toEqual(registered);
  });
});
