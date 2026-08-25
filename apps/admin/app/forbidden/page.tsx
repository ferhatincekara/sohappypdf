import Link from "next/link";

export default function AdminForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold tracking-tight">Access denied</h1>
      <p className="text-sm text-muted-foreground">
        This account is signed in, but it is not an allowlisted operator.
      </p>
      <Link
        href="/login"
        className="text-sm font-medium underline-offset-4 hover:underline"
      >
        Sign in with another account
      </Link>
    </main>
  );
}
