import { describe, expect, test } from "bun:test";
import { APP_PATHS } from "./app-paths";
import {
  APP_NAVIGATION,
  PRIMARY_APP_NAVIGATION,
  SECONDARY_APP_NAVIGATION,
} from "./navigation";

describe("app navigation", () => {
  test("keeps a single source of truth for the initial product routes", () => {
    expect(APP_NAVIGATION.map((item) => item.href)).toEqual([
      APP_PATHS.overview,
      APP_PATHS.files,
      APP_PATHS.conversions,
      APP_PATHS.apiKeys,
      APP_PATHS.settings,
    ]);
  });

  test("separates settings from the primary destinations", () => {
    expect(PRIMARY_APP_NAVIGATION.map((item) => item.id)).toEqual([
      "overview",
      "files",
      "conversions",
      "apiKeys",
    ]);
    expect(SECONDARY_APP_NAVIGATION.map((item) => item.id)).toEqual([
      "settings",
    ]);
  });
});
