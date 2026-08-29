import { describe, expect, test } from "bun:test";
import {
  LEGAL_PAGE_IDS,
  LEGAL_PAGE_SECTIONS,
  LEGAL_PATHS,
} from "@/features/legal/lib/legal-paths";

describe("legal paths", () => {
  test("keeps the four documents on stable public URLs", () => {
    expect([...LEGAL_PAGE_IDS]).toEqual([
      "security",
      "privacy",
      "terms",
      "cookies",
    ]);
    expect(LEGAL_PATHS).toEqual({
      security: "/security",
      privacy: "/privacy",
      terms: "/terms",
      cookies: "/cookies",
    });
  });

  test("defines sections for every legal page", () => {
    for (const pageId of LEGAL_PAGE_IDS) {
      expect(LEGAL_PAGE_SECTIONS[pageId].length).toBeGreaterThan(0);
    }
  });
});
