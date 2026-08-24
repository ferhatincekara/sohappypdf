import { describe, expect, test } from "bun:test";
import { AUTH_PATHS } from "@/features/auth/paths";
import { getMarketingFooterLinks, MARKETING_NAV_LINKS } from "./marketing-nav";
import { MARKETING_PATHS } from "./marketing-paths";

describe("marketing navigation", () => {
  test("uses tools directory companions with pricing and developer routes", () => {
    expect(MARKETING_NAV_LINKS.map((item) => item.href)).toEqual([
      MARKETING_PATHS.pricing,
      MARKETING_PATHS.developers,
    ]);
  });

  test("footer only links to existing public routes", () => {
    const links = getMarketingFooterLinks(AUTH_PATHS.login);

    expect(links.map((item) => item.href)).toEqual([
      MARKETING_PATHS.tools,
      MARKETING_PATHS.pricing,
      MARKETING_PATHS.developers,
      AUTH_PATHS.login,
    ]);
  });
});
