import { describe, expect, test } from "bun:test";
import { cookieHeaderFromStore } from "@/features/auth/session/session-request-headers";

describe("cookieHeaderFromStore", () => {
  test("returns undefined when there are no cookies", () => {
    expect(cookieHeaderFromStore([])).toBeUndefined();
  });

  test("joins cookies without forwarding other request headers", () => {
    expect(
      cookieHeaderFromStore([
        { name: "better-auth.session_token", value: "abc" },
        { name: "locale", value: "en" },
      ]),
    ).toBe("better-auth.session_token=abc; locale=en");
  });
});
