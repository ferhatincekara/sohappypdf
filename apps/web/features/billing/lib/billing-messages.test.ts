import { describe, expect, test } from "bun:test";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

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
    expect(englishKeys).not.toContain("sections.ai");
    expect(englishKeys).toContain("providerHint");
    expect(englishKeys).toContain("activated");
    expect(englishKeys).toContain("unconfirmed");
    expect(englishKeys).toContain("refreshStatus");
    expect(englishKeys).toContain("checkoutYearlyHint");
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
    expect(englishKeys).toContain("api.packCredits");
    expect(englishKeys).not.toContain("noSubscription");
    expect(englishKeys).not.toContain("ai.title");
  });
});
