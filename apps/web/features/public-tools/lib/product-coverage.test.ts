import { describe, expect, test } from "bun:test";
import { listRegisteredTools } from "@sohappypdf/tools/catalog";
import { PUBLIC_TOOL_ERROR_KEYS } from "@/features/public-tools/lib/public-tool-errors";
import { listPublicToolRouteParams } from "@/features/public-tools/lib/public-tool-routes";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

describe("public product coverage", () => {
  test("localizes every public tool error key in English and Turkish", () => {
    const englishErrors = en.publicTools.errors;
    const turkishErrors = tr.publicTools.errors;

    for (const key of PUBLIC_TOOL_ERROR_KEYS) {
      expect(englishErrors[key].length).toBeGreaterThan(0);
      expect(turkishErrors[key].length).toBeGreaterThan(0);
      expect(englishErrors[key]).not.toContain("ECONNREFUSED");
      expect(englishErrors[key]).not.toContain("AccessDenied");
      expect(englishErrors[key]).not.toMatch(/s3/i);
    }

    expect(englishErrors.tooManyPagesShort.length).toBeGreaterThan(0);
    expect(turkishErrors.tooManyPagesShort.length).toBeGreaterThan(0);
    expect(englishErrors.upgradeTitle.length).toBeGreaterThan(0);
    expect(turkishErrors.upgradeTitle.length).toBeGreaterThan(0);
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
