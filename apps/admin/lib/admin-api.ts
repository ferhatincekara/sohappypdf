import { getAdminApiV1BaseUrl } from "@/config/public-env";
import type {
  AdminActor,
  AdminAnonymousSessionRecord,
  AdminAuditEventRecord,
  AdminBillingInsights,
  AdminCatalogTool,
  AdminExecutionRecord,
  AdminOverview,
  AdminQueueCounts,
  AdminSystemHealth,
  AdminUserDetail,
  AdminUserSummary,
} from "./admin-types";

export class AdminApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

async function adminRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${getAdminApiV1BaseUrl()}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AdminApiError(
      response.status,
      response.status === 401
        ? "Sign in required"
        : response.status === 403
          ? "Administrator access required"
          : "Admin request failed",
    );
  }

  return (await response.json()) as T;
}

export function fetchAdminMe(): Promise<AdminActor> {
  return adminRequest<AdminActor>("/admin/me");
}

export function fetchAdminOverview(): Promise<AdminOverview> {
  return adminRequest<AdminOverview>("/admin/overview");
}

export async function fetchAdminUsers(): Promise<AdminUserSummary[]> {
  const body = await adminRequest<{ users: AdminUserSummary[] }>(
    "/admin/users",
  );
  return body.users;
}

export function fetchAdminUser(userId: string): Promise<AdminUserDetail> {
  return adminRequest<AdminUserDetail>(`/admin/users/${userId}`);
}

export async function fetchAdminAnonymousSessions(): Promise<
  AdminAnonymousSessionRecord[]
> {
  const body = await adminRequest<{ sessions: AdminAnonymousSessionRecord[] }>(
    "/admin/anonymous-sessions",
  );
  return body.sessions;
}

export async function fetchAdminExecutions(): Promise<AdminExecutionRecord[]> {
  const body = await adminRequest<{ executions: AdminExecutionRecord[] }>(
    "/admin/executions",
  );
  return body.executions;
}

export async function fetchAdminQueues(): Promise<{
  conversion: AdminQueueCounts | null;
}> {
  return adminRequest<{ conversion: AdminQueueCounts | null }>("/admin/queues");
}

export function fetchAdminBilling(): Promise<AdminBillingInsights> {
  return adminRequest<AdminBillingInsights>("/admin/billing");
}

export async function fetchAdminTools(): Promise<AdminCatalogTool[]> {
  const body = await adminRequest<{ tools: AdminCatalogTool[] }>(
    "/admin/tools",
  );
  return body.tools;
}

export function fetchAdminHealth(): Promise<AdminSystemHealth> {
  return adminRequest<AdminSystemHealth>("/admin/health");
}

export async function fetchAdminAuditEvents(): Promise<
  AdminAuditEventRecord[]
> {
  const body = await adminRequest<{ events: AdminAuditEventRecord[] }>(
    "/admin/audit",
  );
  return body.events;
}

export async function submitAdminCreditAdjustment(input: {
  userId: string;
  source: "web" | "api" | "ai";
  amount: number;
  reason: string;
}): Promise<void> {
  const response = await fetch(
    `${getAdminApiV1BaseUrl()}/admin/billing/adjustments`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new AdminApiError(
      response.status,
      response.status === 400
        ? "Adjustment was rejected. Check the user, amount, and reason."
        : "Admin request failed",
    );
  }
}
