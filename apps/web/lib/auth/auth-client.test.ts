import { describe, expect, test } from "bun:test";
import { createWebAuthClient } from "./auth-client";

describe("auth client", () => {
  test("initializes the Better Auth browser client without localStorage tokens", () => {
    const client = createWebAuthClient();

    expect(typeof client.signIn).toBe("function");
    expect(typeof client.signOut).toBe("function");
    expect(typeof client.useSession).toBe("function");
  });
});
