import axios from "axios";

export const BILLING_ERROR_KEYS = {
  unauthorized: "unauthorized",
  conflict: "conflict",
  configuration: "configuration",
  rateLimited: "rateLimited",
  networkFailure: "networkFailure",
  unexpected: "unexpected",
} as const;

export type BillingErrorKey =
  (typeof BILLING_ERROR_KEYS)[keyof typeof BILLING_ERROR_KEYS];

export type BillingClientError = {
  code?: string;
  status?: number;
  kind?: "api" | "network";
};

export function toBillingClientError(error: unknown): BillingClientError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const apiError = readApiErrorBody(error.response?.data);

    if (apiError !== undefined) {
      return { kind: "api", code: apiError.code, status };
    }

    if (status === undefined || error.code === "ERR_NETWORK") {
      return { kind: "network", status: 0 };
    }

    return { kind: "api", status };
  }

  if (error instanceof Error && /network/i.test(error.message)) {
    return { kind: "network", status: 0 };
  }

  return { kind: "api" };
}

export function mapBillingError(
  error: BillingClientError | null,
): BillingErrorKey {
  if (error === null) {
    return BILLING_ERROR_KEYS.unexpected;
  }

  if (error.kind === "network" || error.status === 0) {
    return BILLING_ERROR_KEYS.networkFailure;
  }

  if (error.code === "UNAUTHORIZED" || error.status === 401) {
    return BILLING_ERROR_KEYS.unauthorized;
  }

  if (error.code === "CONFLICT" || error.status === 409) {
    return BILLING_ERROR_KEYS.conflict;
  }

  if (error.code === "CONFIGURATION_ERROR" || error.status === 500) {
    return BILLING_ERROR_KEYS.configuration;
  }

  if (error.code === "RATE_LIMITED" || error.status === 429) {
    return BILLING_ERROR_KEYS.rateLimited;
  }

  return BILLING_ERROR_KEYS.unexpected;
}

export function mapUnknownBillingError(error: unknown): BillingErrorKey {
  if (
    error instanceof Error &&
    error.name === "BillingApiRequestError" &&
    "clientError" in error
  ) {
    return mapBillingError(error.clientError as BillingClientError);
  }

  return mapBillingError(toBillingClientError(error));
}

function readApiErrorBody(data: unknown): { code: string } | undefined {
  if (typeof data !== "object" || data === null || !("error" in data)) {
    return undefined;
  }

  const body = data.error;

  if (typeof body !== "object" || body === null || !("code" in body)) {
    return undefined;
  }

  if (typeof body.code !== "string") {
    return undefined;
  }

  return { code: body.code };
}
