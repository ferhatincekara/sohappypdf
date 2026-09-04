import { notFound } from "next/navigation";
import { DetailGrid, DetailSection } from "@/components/admin/detail-section";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatBytes, formatDateTime, formatDurationMs } from "@/lib/format";
import { getAdminExecutionDetail } from "@/server/query/executions";

export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAdminExecutionDetail(id);

  if (detail === null) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={detail.execution.conversionType}
        description={`Execution ${detail.execution.id}`}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <DetailSection title="Execution">
          <DetailGrid
            items={[
              { label: "ID", value: detail.execution.id },
              { label: "Tool", value: detail.execution.conversionType },
              {
                label: "Status",
                value: <StatusBadge value={detail.execution.status} />,
              },
              {
                label: "Created",
                value: formatDateTime(detail.execution.createdAt),
              },
              {
                label: "Queued",
                value: formatDateTime(detail.execution.queuedAt),
              },
              {
                label: "Started",
                value: formatDateTime(detail.execution.startedAt),
              },
              {
                label: "Completed",
                value: formatDateTime(detail.execution.completedAt),
              },
              {
                label: "Duration",
                value: formatDurationMs(detail.execution.durationMs),
              },
            ]}
          />
        </DetailSection>
        <DetailSection title="Owner">
          <DetailGrid
            items={[
              { label: "Channel", value: detail.owner.channel },
              { label: "Owner type", value: detail.owner.kind },
              { label: "Owner ID", value: detail.owner.id },
              { label: "Email", value: detail.owner.email ?? "—" },
              { label: "API key", value: detail.owner.apiKeyId ?? "—" },
            ]}
          />
        </DetailSection>
        <DetailSection title="Input">
          <DetailGrid
            items={[
              {
                label: "Filename",
                value: detail.sourceFile?.originalFilename ?? "—",
              },
              {
                label: "Type",
                value:
                  detail.sourceFile?.mimeType ?? detail.execution.sourceFormat,
              },
              {
                label: "Size",
                value: formatBytes(detail.sourceFile?.sizeBytes),
              },
              { label: "Files", value: "1" },
            ]}
          />
        </DetailSection>
        <DetailSection title="Output">
          <DetailGrid
            items={[
              {
                label: "Filename",
                value: detail.outputFile?.originalFilename ?? "—",
              },
              {
                label: "Type",
                value:
                  detail.outputFile?.mimeType ?? detail.execution.targetFormat,
              },
              {
                label: "Size",
                value: formatBytes(detail.outputFile?.sizeBytes),
              },
              {
                label: "Expires",
                value: formatDateTime(
                  detail.outputFile?.expiresAt ?? detail.execution.expiresAt,
                ),
              },
            ]}
          />
        </DetailSection>
        <DetailSection title="Error">
          <DetailGrid
            items={[
              { label: "Code", value: detail.execution.errorCode ?? "—" },
              { label: "Message", value: detail.execution.errorMessage ?? "—" },
            ]}
          />
        </DetailSection>
        <DetailSection title="Timeline">
          <ol className="space-y-2 text-sm">
            {detail.timeline.map((item) => (
              <li key={item.label} className="flex justify-between gap-3">
                <span>{item.label}</span>
                <span className="text-muted-foreground">
                  {formatDateTime(item.at)}
                </span>
              </li>
            ))}
          </ol>
        </DetailSection>
      </div>
    </>
  );
}
