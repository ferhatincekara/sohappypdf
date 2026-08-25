import { AdminShell } from "@/components/admin-shell";
import { fetchAdminAnonymousSessions } from "@/lib/admin-api";
import { requireAdminPage } from "@/lib/require-admin-page";

export default async function AdminAnonymousPage() {
  const actor = await requireAdminPage();
  const sessions = await fetchAdminAnonymousSessions();

  return (
    <AdminShell actor={actor}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Anonymous sessions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Session identifiers and activity metadata. Browser secrets are never
            shown.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Session</th>
                <th className="px-4 py-3 font-medium">Last seen</th>
                <th className="px-4 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-xs">{session.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {session.lastSeenAt.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {session.expiresAt.slice(0, 16).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
