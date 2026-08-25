import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { fetchAdminUsers } from "@/lib/admin-api";
import { requireAdminPage } from "@/lib/require-admin-page";

export default async function AdminUsersPage() {
  const actor = await requireAdminPage();
  const users = await fetchAdminUsers();

  return (
    <AdminShell actor={actor}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Authenticated accounts. Passwords and secrets are never shown.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.userId}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/users/${user.userId}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {user.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.createdAt.slice(0, 10)}
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
