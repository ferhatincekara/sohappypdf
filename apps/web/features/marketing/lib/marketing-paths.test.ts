import { describe, expect, test } from "bun:test";
import { MARKETING_PATHS, PUBLIC_MARKETING_ROUTES } from "./marketing-paths";

describe("public marketing routes", () => {
  test("exposes only real public routes", () => {
    expect(PUBLIC_MARKETING_ROUTES).toEqual([
      "/",
      "/pricing",
      "/developers",
      "/login",
      "/signup",
    ]);
    expect(MARKETING_PATHS.product).toBe("/#product");
  });

  test("does not invent legal or content routes", () => {
    const routes = JSON.stringify(MARKETING_PATHS);

    expect(routes).not.toContain("/terms");
    expect(routes).not.toContain("/privacy");
    expect(routes).not.toContain("/blog");
    expect(routes).not.toContain("/careers");
  });
});
