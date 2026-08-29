import { describe, expect, test } from "bun:test";
import { buildRobots, ROBOTS_DISALLOW } from "@/features/seo/lib/robots-policy";

describe("robots policy", () => {
  test("keeps private and duplicate routes out of the index", () => {
    const robots = buildRobots("https://sohappypdf.com/");

    expect(robots.sitemap).toBe("https://sohappypdf.com/sitemap.xml");
    expect(robots.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
    });
    expect(ROBOTS_DISALLOW).toEqual([
      "/account",
      "/account/",
      "/ui",
      "/register",
      "/reset-password",
    ]);
  });
});
