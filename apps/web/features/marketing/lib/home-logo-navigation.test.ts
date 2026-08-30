import { describe, expect, test } from "bun:test";
import { shouldSmoothScrollHomeLogo } from "@/features/marketing/lib/home-logo-navigation";

const unmodifiedClick = {
  button: 0,
  metaKey: false,
  altKey: false,
  ctrlKey: false,
  shiftKey: false,
} as const;

describe("home logo navigation", () => {
  test("smooth-scrolls on the home page for a plain click", () => {
    expect(
      shouldSmoothScrollHomeLogo({
        pathname: "/",
        ...unmodifiedClick,
      }),
    ).toBe(true);
  });

  test("lets other pages navigate home", () => {
    expect(
      shouldSmoothScrollHomeLogo({
        pathname: "/pricing",
        ...unmodifiedClick,
      }),
    ).toBe(false);
  });

  test("keeps modified clicks as normal link behavior", () => {
    expect(
      shouldSmoothScrollHomeLogo({
        pathname: "/",
        ...unmodifiedClick,
        metaKey: true,
      }),
    ).toBe(false);
    expect(
      shouldSmoothScrollHomeLogo({
        pathname: "/",
        ...unmodifiedClick,
        button: 1,
      }),
    ).toBe(false);
  });
});
