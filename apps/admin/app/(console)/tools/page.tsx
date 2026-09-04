import { DataTable } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { listAdminTools } from "@/server/query/tools";

export default function ToolsPage() {
  const tools = listAdminTools();

  return (
    <>
      <PageHeader
        title="Tools"
        description="Operational view of the @sohappypdf/tools catalog. Definitions are not duplicated here."
      />
      <DataTable
        columns={[
          { id: "tool", header: "Tool", cell: (row) => row.id },
          { id: "category", header: "Category", cell: (row) => row.category },
          { id: "route", header: "Route", cell: (row) => row.route },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.availability} />,
          },
          {
            id: "access",
            header: "Access",
            cell: (row) =>
              `${row.availableOnPlans.includes("free") ? "Free" : "Pro"} · Web ${row.webAccess ? "✓" : "—"} · API ${row.apiAccess ? "✓" : "—"}`,
          },
          {
            id: "processor",
            header: "Processor",
            cell: (row) => row.processorId,
          },
          {
            id: "cost",
            header: "Cost",
            cell: (row) =>
              `${row.webCreditCost} web · ${row.apiCreditCost} API`,
          },
        ]}
        rows={tools}
        rowKey={(row) => row.id}
        href={(row) => `/tools/${row.id}`}
        emptyTitle="No tools"
        emptyDescription="The catalog is empty."
      />
    </>
  );
}
