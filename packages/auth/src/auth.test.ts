import { describe, expect, test } from "bun:test";
import { isAppError } from "@sohappypdf/core";
import { memoryAdapter } from "better-auth/adapters/memory";
import { convertSetCookieToCookie } from "better-auth/test";
import { createAuth } from "./auth.js";
import { requireAuthSession } from "./auth-session.js";

const TEST_PASSWORD = "password1234";

function createTestAuth() {
  const store: Record<string, Array<Record<string, unknown>>> = {
    user: [],
    session: [],
    account: [],
    verification: [],
  };

  const auth = createAuth({
    config: {
      secret: "a".repeat(32),
      baseUrl: "http://localhost:3000",
      runtimeEnv: "test",
      useSecureCookies: false,
    },
    database: memoryAdapter(store),
  });

  return { auth, store };
}

describe("createAuth", () => {
  test("enables email/password and keeps sessions server-side", () => {
    const { auth } = createTestAuth();

    expect(auth.options.emailAndPassword?.enabled).toBe(true);
    expect(auth.options.emailAndPassword?.requireEmailVerification).toBe(false);
    expect(auth.options.user?.changeEmail?.enabled).toBe(true);
    expect(auth.options.user?.changeEmail?.updateEmailWithoutVerification).toBe(
      true,
    );
    expect(auth.options.emailAndPassword?.password).toBeUndefined();
    expect(auth.options.socialProviders).toBeUndefined();
    expect(auth.options.account?.accountLinking).toBeUndefined();
    expect(auth.options.plugins ?? []).toEqual([]);
    expect(auth.options.session?.cookieCache?.enabled).toBe(false);
    expect(auth.options.advanced?.useSecureCookies).toBe(false);
    expect(auth.options.advanced?.crossSubDomainCookies).toBeUndefined();
    expect(auth.options.advanced?.defaultCookieAttributes?.httpOnly).toBe(true);
    expect(auth.options.telemetry?.enabled).toBe(false);
    expect(auth.options.advanced?.database?.joins).not.toBe(true);
    expect(auth.options.onAPIError?.throw).toBe(true);
    expect(auth.options.trustedOrigins).toEqual(["http://localhost:3000"]);
  });

  test("trusts additional browser origins for cross-origin cookie auth", () => {
    const auth = createAuth({
      config: {
        secret: "a".repeat(32),
        baseUrl: "http://localhost:3001",
        runtimeEnv: "test",
        useSecureCookies: false,
      },
      database: memoryAdapter({
        user: [],
        session: [],
        account: [],
        verification: [],
      }),
      trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
    });

    expect(auth.options.trustedOrigins).toEqual([
      "http://localhost:3001",
      "http://localhost:3000",
    ]);
  });

  test("isolates admin cookies from the public site cookie domain", () => {
    const auth = createAuth({
      config: {
        secret: "a".repeat(32),
        baseUrl: "https://api.sohappypdf.com",
        runtimeEnv: "production",
        useSecureCookies: true,
        cookieDomain: "sohappypdf.com",
      },
      database: memoryAdapter({
        user: [],
        session: [],
        account: [],
        verification: [],
      }),
      cookiePrefix: "sohappypdf-admin",
      shareCookiesAcrossSubdomains: false,
    });

    expect(auth.options.advanced?.cookiePrefix).toBe("sohappypdf-admin");
    expect(auth.options.advanced?.crossSubDomainCookies).toBeUndefined();
    expect(auth.options.advanced?.defaultCookieAttributes?.sameSite).toBe(
      "lax",
    );
  });

  test("sets a parent cookie domain for split web and API hosts", () => {
    const auth = createAuth({
      config: {
        secret: "a".repeat(32),
        baseUrl: "https://api.sohappypdf.com",
        runtimeEnv: "production",
        useSecureCookies: true,
        cookieDomain: "sohappypdf.com",
      },
      database: memoryAdapter({
        user: [],
        session: [],
        account: [],
        verification: [],
      }),
    });

    expect(auth.options.advanced?.crossSubDomainCookies).toEqual({
      enabled: true,
      domain: "sohappypdf.com",
    });
    expect(auth.options.advanced?.useSecureCookies).toBe(true);
    expect(auth.options.advanced?.defaultCookieAttributes?.sameSite).toBe(
      "none",
    );
    expect(auth.options.advanced?.defaultCookieAttributes?.secure).toBe(true);
    expect(auth.options.trustedOrigins).toEqual([
      "https://api.sohappypdf.com",
      "https://sohappypdf.com",
      "https://www.sohappypdf.com",
    ]);
  });

  test("trusts the public site origin for cookie-bearing login posts", () => {
    const auth = createAuth({
      config: {
        secret: "a".repeat(32),
        baseUrl: "https://api.sohappypdf.com",
        appUrl: "https://sohappypdf.com",
        runtimeEnv: "production",
        useSecureCookies: true,
        cookieDomain: "sohappypdf.com",
      },
      database: memoryAdapter({
        user: [],
        session: [],
        account: [],
        verification: [],
      }),
    });

    expect(auth.options.trustedOrigins).toEqual([
      "https://api.sohappypdf.com",
      "https://sohappypdf.com",
      "https://www.sohappypdf.com",
    ]);
  });

  test("enables Google sign-in and links matching emails to existing accounts", () => {
    const auth = createAuth({
      config: {
        secret: "a".repeat(32),
        baseUrl: "http://localhost:3000",
        runtimeEnv: "test",
        useSecureCookies: false,
        google: {
          clientId: "google-client-id",
          clientSecret: "google-client-secret",
        },
      },
      database: memoryAdapter({
        user: [],
        session: [],
        account: [],
        verification: [],
      }),
    });

    expect(auth.options.socialProviders?.google?.clientId).toBe(
      "google-client-id",
    );
    expect(auth.options.account?.accountLinking?.enabled).toBe(true);
    expect(auth.options.account?.accountLinking?.trustedProviders).toEqual([
      "google",
    ]);
    expect(
      auth.options.account?.accountLinking?.requireLocalEmailVerified,
    ).toBe(false);
  });

  test("creates a user with a hashed credential and a server session", async () => {
    const { auth, store } = createTestAuth();

    const result = await auth.api.signUpEmail({
      body: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: TEST_PASSWORD,
      },
    });

    expect(result.user.email).toBe("ada@example.com");
    expect(result.user.name).toBe("Ada Lovelace");
    expect(result.token).toBeTypeOf("string");
    expect(result.token?.length).toBeGreaterThan(0);
    expect("password" in result.user).toBe(false);

    const accounts = store.account ?? [];
    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.password).toBeDefined();
    expect(accounts[0]?.password).not.toBe(TEST_PASSWORD);
    expect(accounts[0]?.issuer).toBe("local:credential");
    expect(store.session).toHaveLength(1);
  });

  test("authenticates a password and requires a session for protected access", async () => {
    const { auth } = createTestAuth();

    const signedUp = await auth.api.signUpEmail({
      body: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: TEST_PASSWORD,
      },
      asResponse: true,
    });

    const signedIn = await auth.api.signInEmail({
      body: {
        email: "ada@example.com",
        password: TEST_PASSWORD,
      },
      asResponse: true,
    });

    expect(signedUp.status).toBe(200);
    expect(signedIn.status).toBe(200);

    const session = await requireAuthSession(
      auth,
      convertSetCookieToCookie(signedIn.headers),
    );

    expect(session.user.email).toBe("ada@example.com");
    expect(session.session.userId).toBe(session.user.id);

    const adminAuth = createAuth({
      config: {
        secret: "a".repeat(32),
        baseUrl: "http://localhost:3000",
        runtimeEnv: "test",
        useSecureCookies: false,
      },
      database: memoryAdapter({
        user: [],
        session: [],
        account: [],
        verification: [],
      }),
      cookiePrefix: "sohappypdf-admin",
      shareCookiesAcrossSubdomains: false,
    });

    expect(
      await adminAuth.api.getSession({
        headers: convertSetCookieToCookie(signedIn.headers),
      }),
    ).toBeNull();

    try {
      await requireAuthSession(auth, new Headers());
      throw new Error("expected authentication to fail");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    }
  });
});
