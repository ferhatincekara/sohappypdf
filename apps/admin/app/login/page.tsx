import {
  ACCOUNT_SUSPENDED_ERROR_MESSAGE,
  requireAdminAccess,
} from "@sohappypdf/auth";
import { loadAdminConfig } from "@sohappypdf/config";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { getAdminSession } from "@/server/auth/session";

export default async function LoginPage() {
  const session = await getAdminSession();
  let isAdministrator = false;
  let sessionBlockedReason: "suspended" | "unauthorized" | null = null;

  if (session !== null) {
    try {
      await requireAdminAccess({
        userId: session.user.id,
        bootstrapUserIds: loadAdminConfig().bootstrapUserIds,
      });
      isAdministrator = true;
    } catch (error) {
      if (
        !(error instanceof AppError) ||
        (error.code !== APP_ERROR_CODES.FORBIDDEN &&
          error.code !== APP_ERROR_CODES.UNAUTHORIZED)
      ) {
        throw error;
      }

      sessionBlockedReason =
        error.message === ACCOUNT_SUSPENDED_ERROR_MESSAGE
          ? "suspended"
          : "unauthorized";
    }
  }

  if (isAdministrator) {
    redirect("/");
  }

  return (
    <AuthShell
      title="Sign in"
      description="Use an administrator account on this console. A regular sohappypdf.com login stays on the public site and cannot open admin."
    >
      {session !== null ? (
        <div className="space-y-4">
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {sessionBlockedReason === "suspended"
              ? `The account for ${session.user.email} is suspended and cannot sign in.`
              : `An admin session is present for ${session.user.email}, but that account is not authorized.`}
          </p>
          <SignOutButton label="Sign out to continue" className="w-full" />
        </div>
      ) : (
        <LoginForm />
      )}
    </AuthShell>
  );
}
