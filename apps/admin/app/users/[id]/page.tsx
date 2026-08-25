import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminApiError, fetchAdminUser } from "@/lib/admin-api";
import { requireAdminPage } from "@/lib/require-admin-page";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAdminPage();
  const { id } = await params;

  let detail: Awaited<ReturnType<typeof fetchAdminUser>>;

  try {
    detail = await fetchAdminUser(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <AdminShell actor={actor}>
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/users"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Users
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            {detail.user.email}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {detail.user.name}
          </p>
        </div>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="mt-2 text-lg font-semibold capitalize">
              {detail.plan}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Billing status</p>
            <p className="mt-2 text-lg font-semibold">
              {detail.subscriptionStatus ?? "None"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Web credits left</p>
            <p className="mt-2 text-lg font-semibold">
              {detail.webCredits.webCreditsRemaining}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">AI credits left</p>
            <p className="mt-2 text-lg font-semibold">
              {detail.aiCredits.aiCreditsRemaining}
            </p>
          </div>
        </section>
        <section>
          <h2 className="text-sm font-medium">Recent processing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Execution metadata only. Files are temporary.
          </p>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
            {detail.recentExecutions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                No recent processing.
              </li>
            ) : (
              detail.recentExecutions.map((item) => (
                <li key={item.id} className="px-4 py-3 text-sm">
                  <span className="font-medium">{item.tool}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {item.status}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {item.createdAt.slice(0, 16).replace("T", " ")}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
