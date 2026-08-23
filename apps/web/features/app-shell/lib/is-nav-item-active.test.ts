import { describe, expect, test } from "bun:test";
import { APP_PATHS } from "../config/app-paths";
import { isNavItemActive } from "./is-nav-item-active";

describe("isNavItemActive", () => {
  test("activates overview only on the exact /app route", () => {
    expect(isNavItemActive("/app", APP_PATHS.overview)).toBe(true);
    expect(isNavItemActive("/app/files", APP_PATHS.overview)).toBe(false);
    expect(isNavItemActive("/app/conversions", APP_PATHS.overview)).toBe(false);
  });

  test("activates a section for itself and nested paths only", () => {
    expect(isNavItemActive("/app/files", APP_PATHS.files)).toBe(true);
    expect(isNavItemActive("/app/files/upload", APP_PATHS.files)).toBe(true);
    expect(isNavItemActive("/app/conversions", APP_PATHS.files)).toBe(false);
    expect(isNavItemActive("/app", APP_PATHS.files)).toBe(false);
  });
});
