import { describe, expect, test } from "bun:test";
import type { AuthBrowserClient, AuthClientResult } from "./auth-actions";
import { createAuthActions } from "./auth-actions";
import { AUTH_ERROR_KEYS } from "./auth-errors";

function success(): AuthClientResult {
  return { data: { ok: true }, error: null };
}

function failure(code: string): AuthClientResult {
  return { data: null, error: { code } };
}

function createMockClient(
  overrides: Partial<{
    signIn: AuthBrowserClient["signIn"]["email"];
    signUp: AuthBrowserClient["signUp"]["email"];
    signOut: AuthBrowserClient["signOut"];
    requestPasswordReset: AuthBrowserClient["requestPasswordReset"];
    resetPassword: AuthBrowserClient["resetPassword"];
    changePassword: AuthBrowserClient["changePassword"];
    updateUser: AuthBrowserClient["updateUser"];
    changeEmail: AuthBrowserClient["changeEmail"];
  }> = {},
): AuthBrowserClient {
  return {
    signIn: {
      email: overrides.signIn ?? (async () => success()),
    },
    signUp: {
      email: overrides.signUp ?? (async () => success()),
    },
    signOut: overrides.signOut ?? (async () => success()),
    requestPasswordReset:
      overrides.requestPasswordReset ?? (async () => success()),
    resetPassword: overrides.resetPassword ?? (async () => success()),
    changePassword: overrides.changePassword ?? (async () => success()),
    updateUser: overrides.updateUser ?? (async () => success()),
    changeEmail: overrides.changeEmail ?? (async () => success()),
  };
}

describe("auth actions", () => {
  test("signs in with email and password", async () => {
    const actions = createAuthActions(createMockClient());
    const result = await actions.signInWithEmail({
      email: "ada@example.com",
      password: "password1234",
    });

    expect(result).toEqual({ ok: true });
  });

  test("maps failed authentication", async () => {
    const actions = createAuthActions(
      createMockClient({
        signIn: async () => failure("INVALID_EMAIL_OR_PASSWORD"),
      }),
    );
    const result = await actions.signInWithEmail({
      email: "ada@example.com",
      password: "wrong-password",
    });

    expect(result).toEqual({
      ok: false,
      messageKey: AUTH_ERROR_KEYS.invalidCredentials,
    });
  });

  test("signs up with the submitted name", async () => {
    let receivedName = "";
    const actions = createAuthActions(
      createMockClient({
        signUp: async (input) => {
          receivedName = input.name;
          return success();
        },
      }),
    );

    await actions.signUpWithEmail({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password1234",
    });

    expect(receivedName).toBe("Ada Lovelace");
  });

  test("treats forgot-password as successful without revealing account existence", async () => {
    const actions = createAuthActions(
      createMockClient({
        requestPasswordReset: async () => failure("USER_NOT_FOUND"),
      }),
    );
    const result = await actions.requestPasswordReset({
      email: "missing@example.com",
      redirectTo: "http://localhost:3000/reset-password",
    });

    expect(result).toEqual({ ok: true });
  });

  test("maps an expired reset token", async () => {
    const actions = createAuthActions(
      createMockClient({
        resetPassword: async () => failure("INVALID_TOKEN"),
      }),
    );
    const result = await actions.resetPassword({
      password: "password1234",
      token: "expired",
    });

    expect(result).toEqual({
      ok: false,
      messageKey: AUTH_ERROR_KEYS.expiredResetToken,
    });
  });

  test("signs out through Better Auth", async () => {
    const actions = createAuthActions(createMockClient());
    await expect(actions.signOut()).resolves.toEqual({ ok: true });
  });

  test("maps an incorrect current password without treating it as a weak password", async () => {
    const actions = createAuthActions(
      createMockClient({
        changePassword: async () => failure("INVALID_PASSWORD"),
      }),
    );
    const result = await actions.changePassword({
      currentPassword: "wrong-password",
      password: "password1234",
    });

    expect(result).toEqual({
      ok: false,
      messageKey: AUTH_ERROR_KEYS.currentPasswordIncorrect,
    });
  });

  test("updates the display name through Better Auth", async () => {
    let receivedName = "";
    const actions = createAuthActions(
      createMockClient({
        updateUser: async (input) => {
          receivedName = input.name ?? "";
          return success();
        },
      }),
    );
    const result = await actions.updateUser({ name: "Ada Lovelace" });

    expect(result).toEqual({ ok: true });
    expect(receivedName).toBe("Ada Lovelace");
  });

  test("changes email through Better Auth", async () => {
    let receivedEmail = "";
    const actions = createAuthActions(
      createMockClient({
        changeEmail: async (input) => {
          receivedEmail = input.newEmail;
          return success();
        },
      }),
    );
    const result = await actions.changeEmail({ email: "new@example.com" });

    expect(result).toEqual({ ok: true });
    expect(receivedEmail).toBe("new@example.com");
  });
});
