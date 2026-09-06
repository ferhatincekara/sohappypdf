import { describe, expect, test } from "bun:test";
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

describe("billing locales", () => {
  test("keeps billing keys aligned across locales", () => {
    const englishKeys = flattenKeys(en.billing).sort();

    for (const [locale, catalog] of Object.entries(catalogs)) {
      if (locale === "en") {
        continue;
      }

      expect(flattenKeys(catalog.billing).sort(), locale).toEqual(englishKeys);
    }
    expect(englishKeys).toContain("sections.web");
    expect(englishKeys).toContain("sections.api");
    expect(englishKeys).not.toContain("sections.ai");
    expect(englishKeys).toContain("providerHint");
    expect(englishKeys).toContain("activated");
    expect(englishKeys).toContain("unconfirmed");
    expect(englishKeys).toContain("refreshStatus");
    expect(englishKeys).toContain("checkoutYearlyHint");
    expect(englishKeys).toContain("switchToYearly");
    expect(englishKeys).toContain("switchToMonthly");
    expect(englishKeys).toContain("switchingInterval");
    expect(englishKeys).toContain("perMonth");
    expect(englishKeys).toContain("perYear");
    expect(englishKeys).toContain("api.includedHint");
    expect(englishKeys).toContain("api.includedTitle");
    expect(englishKeys).toContain("api.usageWithoutTool");
    expect(englishKeys).toContain("api.ledger.consume");
    expect(englishKeys).toContain("api.history.reset");
    expect(englishKeys).toContain("api.creditsResetOn");
    expect(englishKeys).toContain("api.recentUsageHint");
    expect(englishKeys).toContain("remaining");
    expect(englishKeys).toContain("usedOfLimit");
    expect(englishKeys).toContain("renewsOn");
    expect(englishKeys).toContain("includedOperations");
    expect(englishKeys).toContain("includedWebCredits");
    expect(englishKeys).toContain("api.packCredits");
    expect(englishKeys).toContain("webPlans");
    expect(en.billing.api.switchConfirmBody).toContain("{price}{unit}");
    expect(tr.billing.api.switchConfirmBody).toContain("{price}{unit}");
    expect(englishKeys).not.toContain("noSubscription");
    expect(englishKeys).not.toContain("ai.title");
  });
});
