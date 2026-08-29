import { describe, expect, test } from "bun:test";
import {
  resolveAccountDisplayName,
  resolveAccountInitial,
} from "@/features/app-shell/lib/account-display-name";

describe("resolveAccountDisplayName", () => {
  test("prefers a real name over the email", () => {
    expect(
      resolveAccountDisplayName("Ferhat Incekara", "ferhat@example.com"),
    ).toBe("Ferhat Incekara");
  });

  test("falls back to the email local part when the name is empty or an email", () => {
    expect(resolveAccountDisplayName("", "ferhat@example.com")).toBe("ferhat");
    expect(
      resolveAccountDisplayName("ferhat@example.com", "ferhat@example.com"),
    ).toBe("ferhat");
  });
});

describe("resolveAccountInitial", () => {
  test("returns the first character in uppercase", () => {
    expect(resolveAccountInitial("ferhat")).toBe("F");
  });

  test("returns a fallback when the name is empty", () => {
    expect(resolveAccountInitial("")).toBe("?");
  });
});
