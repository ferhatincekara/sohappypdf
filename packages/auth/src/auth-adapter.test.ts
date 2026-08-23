import { describe, expect, test } from "bun:test";
import { account, session, user, verification } from "@repo/db";
import { createAuthAdapterSchema } from "./auth-adapter.js";

describe("createAuthAdapterSchema", () => {
  test("maps Better Auth models to the Drizzle auth tables", () => {
    const schema = createAuthAdapterSchema();

    expect(schema.user).toBe(user);
    expect(schema.session).toBe(session);
    expect(schema.account).toBe(account);
    expect(schema.verification).toBe(verification);
    expect(schema.userRelations).toBeDefined();
    expect(schema.sessionRelations).toBeDefined();
    expect(schema.accountRelations).toBeDefined();
  });
});
