import { describe, expect, test } from "bun:test";
import { hasAdminRole } from "@sohappypdf/auth";

describe("admin access boundary", () => {
  test("does not treat ordinary users as administrators", () => {
    expect(hasAdminRole("user", "user_1")).toBe(false);
    expect(hasAdminRole("admin", "user_1")).toBe(true);
    expect(hasAdminRole("user", "user_1", ["user_1"])).toBe(true);
    expect(hasAdminRole("user", "user_1", ["someone_else"])).toBe(false);
  });
});
