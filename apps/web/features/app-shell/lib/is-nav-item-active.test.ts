import { describe, expect, test } from "bun:test";
import { APP_PATHS } from "../config/app-paths";
import { isNavItemActive } from "./is-nav-item-active";

describe("isNavItemActive", () => {
  test("activates settings only on the settings route", () => {
    expect(isNavItemActive("/account/settings", APP_PATHS.settings)).toBe(true);
    expect(isNavItemActive("/account/activity", APP_PATHS.settings)).toBe(
      false,
    );
    expect(isNavItemActive("/account", APP_PATHS.settings)).toBe(false);
  });

  test("activates a section for itself and nested paths only", () => {
    expect(isNavItemActive("/account/activity", APP_PATHS.activity)).toBe(true);
    expect(isNavItemActive("/account/activity/abc", APP_PATHS.activity)).toBe(
      true,
    );
    expect(isNavItemActive("/account/billing", APP_PATHS.activity)).toBe(false);
    expect(isNavItemActive("/account/settings", APP_PATHS.activity)).toBe(
      false,
    );
  });
});
