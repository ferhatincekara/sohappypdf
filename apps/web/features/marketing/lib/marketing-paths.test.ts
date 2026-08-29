import { describe, expect, test } from "bun:test";
import {
  MARKETING_PATHS,
  PUBLIC_MARKETING_ROUTES,
} from "@/features/marketing/lib/marketing-paths";

describe("public marketing routes", () => {
  test("exposes only real public routes", () => {
    expect(PUBLIC_MARKETING_ROUTES).toEqual([
      "/",
      "/tools",
      "/pricing",
      "/faq",
      "/blog",
      "/about",
      "/contact",
      "/developers",
      "/login",
      "/signup",
      "/security",
      "/privacy",
      "/terms",
      "/cookies",
    ]);
    expect(MARKETING_PATHS.product).toBe("/#product");
    expect(MARKETING_PATHS.tools).toBe("/tools");
    expect(MARKETING_PATHS.blog).toBe("/blog");
    expect(MARKETING_PATHS.about).toBe("/about");
    expect(MARKETING_PATHS.contact).toBe("/contact");
    expect(MARKETING_PATHS.security).toBe("/security");
    expect(MARKETING_PATHS.privacy).toBe("/privacy");
    expect(MARKETING_PATHS.terms).toBe("/terms");
    expect(MARKETING_PATHS.cookies).toBe("/cookies");
  });

  test("does not invent extra content routes", () => {
    const routes = JSON.stringify(MARKETING_PATHS);

    expect(routes).not.toContain("/careers");
  });
});
