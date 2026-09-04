export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested admin resource does not exist.
        </p>
      </div>
    </main>
  );
}
