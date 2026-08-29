import { describe, expect, test } from "bun:test";
import {
  MARKETING_FOOTER_COMPANY_LINKS,
  MARKETING_FOOTER_LEGAL_LINKS,
  MARKETING_FOOTER_PRODUCT_LINKS,
  MARKETING_FOOTER_TOOL_LINKS,
  MARKETING_MOBILE_MENU_LINKS,
  MARKETING_NAV_LINKS,
  STATUS_PAGE_RECOVERY_LINKS,
} from "@/features/marketing/lib/marketing-nav";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

describe("marketing navigation", () => {
  test("keeps the header to tools plus pricing and developers", () => {
    expect(MARKETING_NAV_LINKS.map((item) => item.href)).toEqual([
      MARKETING_PATHS.pricing,
      MARKETING_PATHS.developers,
    ]);
  });

  test("status page recovery links match the header destinations", () => {
    expect(STATUS_PAGE_RECOVERY_LINKS.map((item) => item.href)).toEqual([
      MARKETING_PATHS.tools,
      MARKETING_PATHS.pricing,
      MARKETING_PATHS.developers,
    ]);
  });

  test("mobile menu lists product pages then company pages", () => {
    expect(MARKETING_MOBILE_MENU_LINKS.map((item) => item.id)).toEqual([
      "tools",
      "pricing",
      "developers",
      "about",
      "blog",
      "faq",
      "contact",
    ]);
  });

  test("footer columns stay on public routes and skip account", () => {
    expect(MARKETING_FOOTER_PRODUCT_LINKS.map((item) => item.href)).toEqual([
      MARKETING_PATHS.tools,
      MARKETING_PATHS.pricing,
      MARKETING_PATHS.developers,
    ]);
    expect(MARKETING_FOOTER_COMPANY_LINKS.map((item) => item.href)).toEqual([
      MARKETING_PATHS.about,
      MARKETING_PATHS.blog,
      MARKETING_PATHS.faq,
      MARKETING_PATHS.contact,
    ]);
    expect(MARKETING_FOOTER_LEGAL_LINKS.map((item) => item.href)).toEqual([
      MARKETING_PATHS.security,
      MARKETING_PATHS.privacy,
      MARKETING_PATHS.terms,
      MARKETING_PATHS.cookies,
    ]);
    expect(MARKETING_FOOTER_TOOL_LINKS.map((item) => item.shortcutId)).toEqual([
      "merge",
      "compress",
      "convert",
      "protect",
    ]);
  });
});
