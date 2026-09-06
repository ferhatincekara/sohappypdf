import { describe, expect, test } from "bun:test";
import {
  MARKETING_SOCIAL_LINK_IDS,
  MARKETING_SOCIAL_LINKS,
} from "@/features/marketing/lib/marketing-social";

describe("marketing social links", () => {
  test("exposes Instagram and LinkedIn on the sohappypdf handle", () => {
    expect(MARKETING_SOCIAL_LINKS.map((item) => item.id)).toEqual([
      ...MARKETING_SOCIAL_LINK_IDS,
    ]);
    expect(MARKETING_SOCIAL_LINKS.map((item) => item.href)).toEqual([
      "https://www.instagram.com/sohappypdf",
      "https://www.linkedin.com/company/sohappypdf",
    ]);
  });

  test("keeps every profile on https and off placeholder hashes", () => {
    for (const item of MARKETING_SOCIAL_LINKS) {
      expect(item.href.startsWith("https://")).toBe(true);
      expect(item.href).toContain("sohappypdf");
      expect(item.href).not.toContain("#");
    }
  });
});
