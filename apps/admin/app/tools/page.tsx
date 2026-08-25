import { AdminShell } from "@/components/admin-shell";
import { fetchAdminTools } from "@/lib/admin-api";
import { requireAdminPage } from "@/lib/require-admin-page";

export default async function AdminToolsPage() {
  const actor = await requireAdminPage();
  const tools = await fetchAdminTools();

  return (
    <AdminShell actor={actor}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only catalog. Availability is not edited at runtime.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tool</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Anonymous</th>
                <th className="px-4 py-3 font-medium">Premium</th>
                <th className="px-4 py-3 font-medium">Credits</th>
                <th className="px-4 py-3 font-medium">Processor</th>
                <th className="px-4 py-3 font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr
                  key={tool.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{tool.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tool.category}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tool.allowsAnonymous ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tool.premium ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tool.webCreditCost}/{tool.apiCreditCost}/
                    {tool.aiCreditCost}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {tool.processorId}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tool.health}
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
