import { AdminShell } from "@/components/admin-shell";
import { fetchAdminHealth } from "@/lib/admin-api";
import { requireAdminPage } from "@/lib/require-admin-page";

const CHECKS = [
  ["API", "api"],
  ["Database", "database"],
  ["Queue", "queue"],
  ["Storage", "storage"],
  ["Worker", "worker"],
] as const;

export default async function AdminHealthPage() {
  const actor = await requireAdminPage();
  const health = await fetchAdminHealth();

  return (
    <AdminShell actor={actor}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            System health
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectivity checks only. Secrets and error details are never shown.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHECKS.map(([label, key]) => (
            <div
              key={key}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 text-lg font-semibold capitalize">
                {health[key].replace("_", " ")}
              </p>
            </div>
          ))}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Failed jobs</p>
            <p className="mt-2 text-lg font-semibold">
              {health.processingFailures}
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
