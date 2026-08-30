import { getPublicWebEnv } from "@/config/public-env";
import {
  AUTH_ERROR_KEYS,
  type AuthClientError,
  type AuthErrorKey,
  mapAuthError,
  shouldTreatForgotPasswordAsSuccess,
} from "@/features/auth/api/auth-errors";
import { resolveGoogleCallbackUrls } from "@/features/auth/lib/google-callback-urls";
import { AUTH_PATHS } from "@/features/auth/paths";
import { authClient } from "@/lib/auth/auth-client";

export type AuthActionResult =
  | { ok: true }
  | { ok: false; messageKey: AuthErrorKey };

export type AuthClientResult = {
  data: unknown;
  error: AuthClientError | null;
};

export type AuthBrowserClient = {
  signIn: {
    email: (input: {
      email: string;
      password: string;
    }) => Promise<AuthClientResult>;
    social: (input: {
      provider: "google";
      callbackURL: string;
      errorCallbackURL: string;
    }) => Promise<AuthClientResult>;
  };
  signUp: {
    email: (input: {
      email: string;
      password: string;
      name: string;
    }) => Promise<AuthClientResult>;
  };
  signOut: () => Promise<AuthClientResult>;
  requestPasswordReset: (input: {
    email: string;
    redirectTo?: string;
  }) => Promise<AuthClientResult>;
  resetPassword: (input: {
    newPassword: string;
    token: string;
  }) => Promise<AuthClientResult>;
  changePassword: (input: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions?: boolean;
  }) => Promise<AuthClientResult>;
  updateUser: (input: { name?: string }) => Promise<AuthClientResult>;
  changeEmail: (input: { newEmail: string }) => Promise<AuthClientResult>;
};

function toActionResult(result: AuthClientResult): AuthActionResult {
  if (result.error !== null) {
    return {
      ok: false,
      messageKey: mapAuthError(result.error),
    };
  }

  return { ok: true };
}

export function createAuthActions(client: AuthBrowserClient) {
  return {
    async signInWithEmail(input: {
      email: string;
      password: string;
    }): Promise<AuthActionResult> {
      return toActionResult(
        await client.signIn.email({
          email: input.email,
          password: input.password,
        }),
      );
    },

    async signInWithGoogle(input: {
      next?: string | null;
      errorPath?: string;
    }): Promise<AuthActionResult> {
      const urls = resolveGoogleCallbackUrls({
        next: input.next,
        errorPath: input.errorPath,
      });

      return toActionResult(
        await client.signIn.social({
          provider: "google",
          callbackURL: urls.callbackURL,
          errorCallbackURL: urls.errorCallbackURL,
        }),
      );
    },

    async signUpWithEmail(input: {
      name: string;
      email: string;
      password: string;
    }): Promise<AuthActionResult> {
      return toActionResult(
        await client.signUp.email({
          name: input.name,
          email: input.email,
          password: input.password,
        }),
      );
    },

    async requestPasswordReset(input: {
      email: string;
      redirectTo?: string;
    }): Promise<AuthActionResult> {
      const result = await client.requestPasswordReset({
        email: input.email,
        redirectTo:
          input.redirectTo ??
          `${getPublicWebEnv().appUrl}${AUTH_PATHS.resetPassword}`,
      });

      if (shouldTreatForgotPasswordAsSuccess(result.error)) {
        return { ok: true };
      }

      return toActionResult(result);
    },

    async resetPassword(input: {
      password: string;
      token: string;
    }): Promise<AuthActionResult> {
      return toActionResult(
        await client.resetPassword({
          newPassword: input.password,
          token: input.token,
        }),
      );
    },

    async changePassword(input: {
      currentPassword: string;
      password: string;
    }): Promise<AuthActionResult> {
      const result = await client.changePassword({
        currentPassword: input.currentPassword,
        newPassword: input.password,
        revokeOtherSessions: true,
      });

      if (result.error?.code === "INVALID_PASSWORD") {
        return {
          ok: false,
          messageKey: AUTH_ERROR_KEYS.currentPasswordIncorrect,
        };
      }

      return toActionResult(result);
    },

    async updateUser(input: { name: string }): Promise<AuthActionResult> {
      return toActionResult(await client.updateUser({ name: input.name }));
    },

    async changeEmail(input: { email: string }): Promise<AuthActionResult> {
      return toActionResult(
        await client.changeEmail({
          newEmail: input.email,
        }),
      );
    },

    async signOut(): Promise<AuthActionResult> {
      return toActionResult(await client.signOut());
    },
  };
}

export const authActions = createAuthActions(
  authClient as unknown as AuthBrowserClient,
);
