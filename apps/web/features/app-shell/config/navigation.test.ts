import { describe, expect, test } from "bun:test";
import { APP_PATHS } from "./app-paths";
import {
  APP_NAVIGATION,
  PRIMARY_APP_NAVIGATION,
  SECONDARY_APP_NAVIGATION,
} from "./navigation";

describe("app navigation", () => {
  test("keeps account routes as the authenticated product surface", () => {
    expect(APP_NAVIGATION.map((item) => item.href)).toEqual([
      APP_PATHS.overview,
      APP_PATHS.usage,
      APP_PATHS.activity,
      APP_PATHS.billing,
      APP_PATHS.apiKeys,
      APP_PATHS.settings,
    ]);
  });

  test("separates settings from the primary destinations", () => {
    expect(PRIMARY_APP_NAVIGATION.map((item) => item.id)).toEqual([
      "overview",
      "usage",
      "activity",
      "billing",
      "apiKeys",
    ]);
    expect(SECONDARY_APP_NAVIGATION.map((item) => item.id)).toEqual([
      "settings",
    ]);
  });

  test("does not expose a file library as a primary destination", () => {
    expect(APP_NAVIGATION.some((item) => item.id === "files")).toBe(false);
    expect(APP_NAVIGATION.map((item) => item.href).join(" ")).not.toContain(
      "/files",
    );
  });
});
