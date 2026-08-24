import { describe, expect, test } from "bun:test";
import { APP_PATHS } from "../config/app-paths";
import { isNavItemActive } from "./is-nav-item-active";

describe("isNavItemActive", () => {
  test("activates overview only on the exact /account route", () => {
    expect(isNavItemActive("/account", APP_PATHS.overview)).toBe(true);
    expect(isNavItemActive("/account/usage", APP_PATHS.overview)).toBe(false);
    expect(isNavItemActive("/account/activity", APP_PATHS.overview)).toBe(
      false,
    );
  });

  test("activates a section for itself and nested paths only", () => {
    expect(isNavItemActive("/account/activity", APP_PATHS.activity)).toBe(true);
    expect(isNavItemActive("/account/activity/abc", APP_PATHS.activity)).toBe(
      true,
    );
    expect(isNavItemActive("/account/usage", APP_PATHS.activity)).toBe(false);
    expect(isNavItemActive("/account", APP_PATHS.activity)).toBe(false);
    expect(isNavItemActive("/account/settings", APP_PATHS.settings)).toBe(true);
  });
});
