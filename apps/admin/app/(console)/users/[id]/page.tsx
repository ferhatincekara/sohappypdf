import { notFound } from "next/navigation";
import { DetailGrid, DetailSection } from "@/components/admin/detail-section";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { resolveAvatarUrl } from "@/features/identity/gravatar-url";
import { UserAvatar } from "@/features/identity/user-avatar";
import {
  AdjustCreditsForm,
  RestoreUserButton,
  RevokeApiKeyButton,
  SuspendUserButton,
  UserActionBar,
} from "@/features/users/user-actions";
import {
  formatDateTime,
  formatNumber,
  maskApiKeyPrefix,
  shortId,
} from "@/lib/format";
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
        leading={
          <UserAvatar
            src={resolveAvatarUrl(detail.user.email, detail.user.image)}
            label={detail.user.name || detail.user.email}
            className="size-11"
          />
        }
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
                label: "Operations today",
                value:
                  webPlan === "pro"
                    ? "Unlimited"
                    : `${formatNumber(detail.credits.web.dailyUsed)} / ${formatNumber(detail.credits.web.dailyLimit ?? 0)}`,
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
        <DetailSection title="API credits">
          <DetailGrid
            items={[
              {
                label: "Remaining",
                value: `${formatNumber(detail.credits.api.apiCreditsRemaining)} left of ${formatNumber(detail.credits.api.apiCreditsGranted)} this period`,
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
        <DetailSection title="API credit ledger">
          <ul className="space-y-1 text-sm">
            {detail.recentLedger.map((entry) => (
              <li key={entry.id}>
                {formatLedgerEntry(entry)} · {formatDateTime(entry.createdAt)}
              </li>
            ))}
          </ul>
        </DetailSection>
      </div>
    </>
  );
}

function formatLedgerEntry(entry: {
  type: string;
  amount: number;
  reason: string;
}): string {
  const verb =
    entry.type === "consume"
      ? "used"
      : entry.type === "refund"
        ? "returned"
        : entry.type === "adjustment"
          ? "adjusted"
          : "added";
  const reason = entry.reason.replace(/^admin:[^:]+:\s*/, "");

  return `${verb} ${entry.amount} API credits${reason.length > 0 ? ` · ${reason}` : ""}`;
}
