import { requireAdminAccess } from "@sohappypdf/auth";
import { loadAdminConfig } from "@sohappypdf/config";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { getAdminSession } from "@/server/auth/session";

export default async function LoginPage() {
  const session = await getAdminSession();
  let isAdministrator = false;

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
    }
  }

  if (isAdministrator) {
    redirect("/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          SoHappyPDF
        </p>
        <h1 className="mt-1 text-xl font-semibold">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with an administrator account. Regular users cannot access
          this console.
        </p>
        <div className="mt-5">
          {session !== null ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are signed in as {session.user.email}, but that account is
                not an administrator.
              </p>
              <SignOutButton label="Sign out to continue" />
            </div>
          ) : (
            <LoginForm />
          )}
        </div>
      </div>
    </main>
  );
}
