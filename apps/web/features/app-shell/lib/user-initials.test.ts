import { describe, expect, test } from "bun:test";
import { getUserInitials } from "@/features/app-shell/lib/user-initials";

describe("getUserInitials", () => {
  test("uses the first letters of a two-part name", () => {
    expect(getUserInitials("Ada Lovelace", "ada@example.com")).toBe("AL");
  });

  test("falls back to the email local part", () => {
    expect(getUserInitials("", "ada@example.com")).toBe("AD");
  });

  test("does not expose internal identifiers", () => {
    expect(getUserInitials("Ada", "ada@example.com")).not.toContain("user_");
  });
});
