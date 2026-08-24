import { describe, expect, test } from "bun:test";
import { APP_PATHS } from "../config/app-paths";
import { resolveAppBreadcrumb } from "./resolve-app-breadcrumb";

describe("resolveAppBreadcrumb", () => {
  test("maps known account routes to their navigation item", () => {
    expect(resolveAppBreadcrumb("/account").id).toBe("overview");
    expect(resolveAppBreadcrumb("/account/activity").href).toBe(
      APP_PATHS.activity,
    );
    expect(resolveAppBreadcrumb("/account/api").id).toBe("apiKeys");
  });

  test("keeps nested section paths on the owning item", () => {
    expect(resolveAppBreadcrumb("/account/activity/abc").id).toBe("activity");
  });
});
