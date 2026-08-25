import { getAdminApiV1BaseUrl } from "@/config/public-env";
import type { AdminActor, AdminOverview } from "./admin-types";

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
