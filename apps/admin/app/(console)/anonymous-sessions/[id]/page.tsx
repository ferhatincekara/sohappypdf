import { notFound } from "next/navigation";
import { DetailGrid, DetailSection } from "@/components/admin/detail-section";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { RevokeAnonymousSessionButton } from "@/features/anonymous-sessions/revoke-session-button";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getAdminAnonymousSession } from "@/server/query/anonymous-sessions";

export default async function AnonymousSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAdminAnonymousSession(id);

  if (detail === null) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Anonymous session"
        description={detail.session.id}
        actions={<RevokeAnonymousSessionButton sessionId={detail.session.id} />}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <DetailSection title="Session">
          <DetailGrid
            items={[
              { label: "ID", value: detail.session.id },
              {
                label: "Created",
                value: formatDateTime(detail.session.createdAt),
              },
              {
                label: "Last activity",
                value: formatDateTime(detail.session.lastSeenAt),
              },
              {
                label: "Expires",
                value: formatDateTime(detail.session.expiresAt),
              },
              {
                label: "Executions",
                value: formatNumber(detail.executionCount),
              },
              {
                label: "Active files",
                value: formatNumber(detail.activeFiles),
              },
              {
                label: "Daily usage",
                value: `${detail.executionsToday} / ${detail.dailyLimit}`,
              },
              {
                label: "Rate-limit status",
                value: (
                  <StatusBadge
                    value={
                      detail.rateLimitStatus === "ok" ? "active" : "warning"
                    }
                    label={detail.rateLimitStatus}
                  />
                ),
              },
            ]}
          />
        </DetailSection>
        <DetailSection title="Recent activity">
          <ul className="space-y-1 text-sm">
            {detail.recentExecutions.map((execution) => (
              <li key={execution.id}>
                <a href={`/executions/${execution.id}`}>
                  {execution.conversionType} · {execution.status} ·{" "}
                  {formatDateTime(execution.createdAt)}
                </a>
              </li>
            ))}
          </ul>
        </DetailSection>
      </div>
    </>
  );
}
