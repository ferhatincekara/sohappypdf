import { SignOutButton } from "@/features/auth/sign-out-button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This console is restricted to SoHappyPDF administrators. Your account
          is signed in but is not authorized for admin access.
        </p>
        <div className="mt-4">
          <SignOutButton label="Sign out" />
        </div>
      </div>
    </main>
  );
}
