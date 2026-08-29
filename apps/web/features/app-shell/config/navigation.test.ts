import { describe, expect, test } from "bun:test";
import { APP_PATHS } from "@/features/app-shell/config/app-paths";
import { APP_NAVIGATION } from "@/features/app-shell/config/navigation";

describe("app navigation", () => {
  test("keeps account destinations in the header menu, not a dashboard", () => {
    expect(APP_NAVIGATION.map((item) => item.id)).toEqual([
      "activity",
      "billing",
      "apiKeys",
      "settings",
    ]);
    expect(APP_NAVIGATION.map((item) => item.href)).toEqual([
      APP_PATHS.activity,
      APP_PATHS.billing,
      APP_PATHS.apiKeys,
      APP_PATHS.settings,
    ]);
  });

  test("does not expose a file library or overview dashboard", () => {
    const ids = APP_NAVIGATION.map((item) => item.id);

    expect(ids).not.toContain("overview");
    expect(ids).not.toContain("files");
    expect(APP_NAVIGATION.map((item) => item.href).join(" ")).not.toContain(
      "/files",
    );
    expect(APP_PATHS.history).toBe("/account/history");
  });
});
