import { AdminShell } from "@/components/admin-shell";
import { fetchAdminExecutions, fetchAdminQueues } from "@/lib/admin-api";
import { requireAdminPage } from "@/lib/require-admin-page";

export default async function AdminOperationsPage() {
  const actor = await requireAdminPage();
  const [executions, queues] = await Promise.all([
    fetchAdminExecutions(),
    fetchAdminQueues(),
  ]);
  const conversion = queues.conversion;

  return (
    <AdminShell actor={actor}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Operations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Processing visibility without payloads, secrets, or object keys.
          </p>
        </div>
        <section>
          <h2 className="text-sm font-medium">Queue</h2>
          {conversion === null ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Queue health is unavailable.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {(
                [
                  ["Waiting", conversion.waiting],
                  ["Active", conversion.active],
                  ["Delayed", conversion.delayed],
                  ["Failed", conversion.failed],
                  ["Completed", conversion.completed],
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="text-sm font-medium">Recent jobs</h2>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
            {executions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground">
                No recent processing.
              </li>
            ) : (
              executions.map((item) => (
                <li key={item.id} className="px-4 py-3 text-sm">
                  <span className="font-medium">{item.tool}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {item.status}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {item.ownerKind}
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
