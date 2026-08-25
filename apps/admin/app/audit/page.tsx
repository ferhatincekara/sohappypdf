import { AdminShell } from "@/components/admin-shell";
import { fetchAdminAuditEvents } from "@/lib/admin-api";
import { requireAdminPage } from "@/lib/require-admin-page";

export default async function AdminAuditPage() {
  const actor = await requireAdminPage();
  const events = await fetchAdminAuditEvents();

  return (
    <AdminShell actor={actor}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Audit log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administrative actions only. Secrets, tokens, and payment
            identifiers are never stored here.
          </p>
        </div>
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {events.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              No administrative actions recorded yet.
            </li>
          ) : (
            events.map((event) => (
              <li key={event.id} className="px-4 py-3 text-sm">
                <p>
                  <span className="font-medium">{event.action}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {event.targetType} · {event.targetId}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.actorEmail ?? event.actorName ?? event.actorUserId}
                  {" · "}
                  {event.createdAt.slice(0, 16).replace("T", " ")}
                </p>
                {event.reason !== null && event.reason !== "" ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.reason}
                  </p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </AdminShell>
  );
}
