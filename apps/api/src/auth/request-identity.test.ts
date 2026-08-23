import { describe, expect, test } from "bun:test";
import { isAppError } from "@repo/core";
import {
  hasAuthenticationHints,
  requireAuthenticatedIdentity,
} from "./request-identity.js";

describe("request identity", () => {
  test("detects authentication hints without reading secret values", () => {
    expect(hasAuthenticationHints(new Headers())).toBe(false);
    expect(hasAuthenticationHints(new Headers({ cookie: "session=1" }))).toBe(
      true,
    );
    expect(
      hasAuthenticationHints(new Headers({ authorization: "Bearer key" })),
    ).toBe(true);
  });

  test("requires a resolved identity for protected work", () => {
    try {
      requireAuthenticatedIdentity({ kind: "anonymous" });
      throw new Error("expected authentication to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    }
  });
});
