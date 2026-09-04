import { notFound } from "next/navigation";
import { DetailGrid, DetailSection } from "@/components/admin/detail-section";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDateTime, formatDurationMs, formatNumber } from "@/lib/format";
import { getAdminToolDetail } from "@/server/query/tools";

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ toolId: string }>;
}) {
  const { toolId } = await params;
  const detail = await getAdminToolDetail(toolId);

  if (detail === null) {
    notFound();
  }

  return (
    <>
      <PageHeader title={detail.tool.id} description={detail.tool.route} />
      <div className="grid gap-4 xl:grid-cols-2">
        <DetailSection title="Definition">
          <DetailGrid
            items={[
              { label: "Category", value: detail.tool.category },
              {
                label: "Availability",
                value: <StatusBadge value={detail.tool.availability} />,
              },
              { label: "Processor", value: detail.tool.processorId },
              {
                label: "Web tool cost",
                value: String(detail.tool.webCreditCost),
              },
              {
                label: "API credits",
                value: String(detail.tool.apiCreditCost),
              },
              {
                label: "Plans",
                value: detail.tool.availableOnPlans.join(", "),
              },
              {
                label: "Anonymous",
                value: detail.tool.allowsAnonymous ? "Yes" : "No",
              },
              { label: "Inputs", value: detail.tool.inputFormats.join(", ") },
              { label: "Outputs", value: detail.tool.outputFormats.join(", ") },
              { label: "Max files", value: String(detail.tool.maxInputCount) },
            ]}
          />
        </DetailSection>
        <DetailSection title="Operational statistics">
          <DetailGrid
            items={[
              { label: "Executions", value: formatNumber(detail.stats.total) },
              {
                label: "Success rate",
                value:
                  detail.stats.successRate === null
                    ? "Unavailable"
                    : `${detail.stats.successRate.toFixed(1)}%`,
              },
              {
                label: "Failure rate",
                value:
                  detail.stats.failureRate === null
                    ? "Unavailable"
                    : `${detail.stats.failureRate.toFixed(1)}%`,
              },
              {
                label: "Average duration",
                value: formatDurationMs(detail.stats.averageDurationMs),
              },
            ]}
          />
        </DetailSection>
        <DetailSection title="Recent failures">
          {detail.recentFailures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent failures.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {detail.recentFailures.map((failure) => (
                <li key={failure.id}>
                  <a href={`/executions/${failure.id}`}>
                    {failure.errorCode ?? "failed"} ·{" "}
                    {formatDateTime(failure.createdAt)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </DetailSection>
      </div>
    </>
  );
}
