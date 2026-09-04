import { notFound } from "next/navigation";
import { DetailGrid, DetailSection } from "@/components/admin/detail-section";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  AdjustCreditsForm,
  RestoreUserButton,
  RevokeApiKeyButton,
  SuspendUserButton,
  UserActionBar,
} from "@/features/users/user-actions";
import { formatDateTime, maskApiKeyPrefix, shortId } from "@/lib/format";
import { getAdminUserDetail } from "@/server/query/users";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAdminUserDetail(id);

  if (detail === null) {
    notFound();
  }

  const webPlan = detail.entitlements.plan;
  const apiSub = detail.apiSubscription;

  return (
    <>
      <PageHeader
        title={detail.user.email}
        description={detail.user.name}
        actions={
          <UserActionBar>
            {detail.user.suspendedAt === null ? (
              <SuspendUserButton
                userId={detail.user.id}
                email={detail.user.email}
              />
            ) : (
              <RestoreUserButton
                userId={detail.user.id}
                email={detail.user.email}
              />
            )}
            <AdjustCreditsForm userId={detail.user.id} />
          </UserActionBar>
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <DetailSection title="Identity">
          <DetailGrid
            items={[
              { label: "User ID", value: detail.user.id },
              { label: "Email", value: detail.user.email },
              { label: "Name", value: detail.user.name },
              { label: "Role", value: detail.user.role },
              {
                label: "Created",
                value: formatDateTime(detail.user.createdAt),
              },
              {
                label: "Status",
                value: (
                  <StatusBadge
                    value={detail.user.suspendedAt ? "suspended" : "active"}
                  />
                ),
              },
              {
                label: "Suspension reason",
                value: detail.user.suspendedReason ?? "—",
              },
            ]}
          />
        </DetailSection>
        <DetailSection title="Subscriptions">
          <DetailGrid
            items={[
              { label: "Web plan", value: <StatusBadge value={webPlan} /> },
              {
                label: "Web subscription",
                value: detail.webSubscription?.status ?? "none",
              },
              {
                label: "Polar web subscription",
                value: detail.webSubscription?.polarSubscriptionId ?? "—",
              },
              {
                label: "Web renewal",
                value: formatDateTime(detail.webSubscription?.currentPeriodEnd),
              },
              {
                label: "Developer plan",
                value: apiSub?.productKey ?? "none",
              },
              {
                label: "Developer status",
                value: apiSub?.status ?? "none",
              },
              {
                label: "Polar API subscription",
                value: apiSub?.polarSubscriptionId ?? "—",
              },
            ]}
          />
        </DetailSection>
        <DetailSection title="Credits">
          <DetailGrid
            items={[
              {
                label: "Web",
                value: `${detail.credits.web.webCreditsRemaining} remaining / ${detail.credits.web.webCreditsGranted} granted`,
              },
              {
                label: "API",
                value: `${detail.credits.api.apiCreditsRemaining} remaining / ${detail.credits.api.apiCreditsGranted} granted`,
              },
              {
                label: "AI",
                value: `${detail.credits.ai.aiCreditsRemaining} remaining / ${detail.credits.ai.aiCreditsGranted} granted`,
              },
            ]}
          />
        </DetailSection>
        <DetailSection title="API keys">
          {detail.apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No API keys.</p>
          ) : (
            <ul className="space-y-2">
              {detail.apiKeys.map((key) => (
                <li
                  key={key.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {maskApiKeyPrefix(key.keyPrefix)} · {shortId(key.id)}
                    </p>
                  </div>
                  {key.revokedAt === null ? (
                    <RevokeApiKeyButton
                      apiKeyId={key.id}
                      keyPrefix={key.keyPrefix}
                    />
                  ) : (
                    <StatusBadge value="revoked" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </DetailSection>
        <DetailSection title="Recent executions">
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
        <DetailSection title="Credit ledger">
          <ul className="space-y-1 text-sm">
            {detail.recentLedger.map((entry) => (
              <li key={entry.id}>
                {entry.type} {entry.source} {entry.amount} · {entry.reason} ·{" "}
                {formatDateTime(entry.createdAt)}
              </li>
            ))}
          </ul>
        </DetailSection>
      </div>
    </>
  );
}
