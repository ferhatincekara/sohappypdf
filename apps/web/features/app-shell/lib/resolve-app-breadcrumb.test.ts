import { describe, expect, test } from "bun:test";
import { APP_PATHS } from "../config/app-paths";
import { resolveAppBreadcrumb } from "./resolve-app-breadcrumb";

describe("resolveAppBreadcrumb", () => {
  test("maps known app routes to their navigation item", () => {
    expect(resolveAppBreadcrumb("/app").id).toBe("overview");
    expect(resolveAppBreadcrumb("/app/files").href).toBe(APP_PATHS.files);
    expect(resolveAppBreadcrumb("/app/api-keys").id).toBe("apiKeys");
  });

  test("keeps nested section paths on the owning item", () => {
    expect(resolveAppBreadcrumb("/app/conversions/abc").id).toBe("conversions");
  });
});
