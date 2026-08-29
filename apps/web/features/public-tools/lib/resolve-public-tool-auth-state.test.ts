import { describe, expect, test } from "bun:test";
import { resolvePublicToolAuthState } from "@/features/public-tools/lib/resolve-public-tool-auth-state";

describe("resolvePublicToolAuthState", () => {
  test("waits for the browser session before choosing an API", () => {
    expect(
      resolvePublicToolAuthState({
        sessionPending: true,
        hasSessionUser: false,
      }),
    ).toEqual({
      isAuthenticated: false,
      authPending: true,
    });
  });

  test("uses authenticated APIs only after the client session confirms", () => {
    expect(
      resolvePublicToolAuthState({
        sessionPending: false,
        hasSessionUser: true,
      }),
    ).toEqual({
      isAuthenticated: true,
      authPending: false,
    });
  });

  test("uses anonymous APIs when the browser has no session", () => {
    expect(
      resolvePublicToolAuthState({
        sessionPending: false,
        hasSessionUser: false,
      }),
    ).toEqual({
      isAuthenticated: false,
      authPending: false,
    });
  });
});
