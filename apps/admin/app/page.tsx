import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminApiError, fetchAdminOverview } from "@/lib/admin-api";
import { getAdminActor } from "@/lib/get-admin-actor";

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  let actor: Awaited<ReturnType<typeof getAdminActor>>;

  try {
    actor = await getAdminActor();
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 403) {
      redirect("/forbidden");
    }

    throw error;
  }

  if (actor === null) {
    redirect("/login");
  }

  const overview = await fetchAdminOverview();

  return (
    <AdminShell actor={actor}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only platform snapshot. Temporary files expire after about two
            hours.
          </p>
        </div>
        <section
          aria-labelledby="accounts-heading"
          className="flex flex-col gap-3"
        >
          <h2 id="accounts-heading" className="text-sm font-medium">
            Accounts
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Users" value={overview.users} />
            <Metric
              label="Anonymous sessions"
              value={overview.anonymousSessions}
            />
          </div>
        </section>
        <section
          aria-labelledby="executions-heading"
          className="flex flex-col gap-3"
        >
          <h2 id="executions-heading" className="text-sm font-medium">
            Recent processing
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Waiting" value={overview.executions.queued} />
            <Metric label="Processing" value={overview.executions.processing} />
            <Metric label="Ready" value={overview.executions.completed} />
            <Metric label="Failed" value={overview.executions.failed} />
            <Metric
              label="Expired results"
              value={overview.executions.expiredReady}
            />
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
