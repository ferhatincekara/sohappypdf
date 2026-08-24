import { describe, expect, test } from "bun:test";
import { isMobileNavEscapeKey, resolveMobileNavOpen } from "./mobile-nav-state";

describe("mobile navigation state", () => {
  test("closes on escape, navigation, and explicit close", () => {
    expect(resolveMobileNavOpen(true, "escape")).toBe(false);
    expect(resolveMobileNavOpen(true, "navigate")).toBe(false);
    expect(resolveMobileNavOpen(true, "close")).toBe(false);
    expect(resolveMobileNavOpen(false, "open")).toBe(true);
    expect(resolveMobileNavOpen(false, "toggle")).toBe(true);
    expect(resolveMobileNavOpen(true, "toggle")).toBe(false);
  });

  test("treats Escape as the close key", () => {
    expect(isMobileNavEscapeKey("Escape")).toBe(true);
    expect(isMobileNavEscapeKey("Enter")).toBe(false);
  });
});
