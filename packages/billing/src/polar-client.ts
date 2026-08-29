import { Polar } from "@polar-sh/sdk";
import type { PolarServer } from "@sohappypdf/config";
import { APP_ERROR_CODES, AppError, isAppError } from "@sohappypdf/core";
import type { PolarClient } from "./billing-types.js";
import { polarApiJson } from "./polar-http.js";

export type CreatePolarClientOptions = {
  accessToken: string;
  server: PolarServer;
};

function requireUrl(url: string | undefined, action: string): string {
  if (url === undefined || url.length === 0) {
    throw new AppError({
      code: APP_ERROR_CODES.INTERNAL_ERROR,
      message: `Polar ${action} did not return a URL`,
    });
  }

  return url;
}

function polarStatusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }

  return undefined;
}

function isRetryablePolarPortalStatus(status: number | undefined): boolean {
  return (
    status === undefined || status === 400 || status === 404 || status === 422
  );
}

export function readPolarValidationSummary(error: unknown): string | undefined {
  const details = readPolarValidationDetails(error);
  if (details.length === 0) {
    return undefined;
  }

  return details
    .map((detail) => `${detail.loc.join(".")}: ${detail.msg}`)
    .join("; ");
}

function readPolarValidationDetails(
  error: unknown,
): Array<{ loc: Array<string | number>; msg: string }> {
  if (typeof error !== "object" || error === null) {
    return [];
  }

  if ("detail" in error && Array.isArray(error.detail)) {
    return parsePolarValidationDetails(error.detail);
  }

  if (
    "data$" in error &&
    typeof error.data$ === "object" &&
    error.data$ !== null &&
    "detail" in error.data$ &&
    Array.isArray(error.data$.detail)
  ) {
    return parsePolarValidationDetails(error.data$.detail);
  }

  if ("body" in error && typeof error.body === "string") {
    try {
      const parsed: unknown = JSON.parse(error.body);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "detail" in parsed &&
        Array.isArray(parsed.detail)
      ) {
        return parsePolarValidationDetails(parsed.detail);
      }
    } catch {
      return [];
    }
  }

  return [];
}

function parsePolarValidationDetails(
  details: unknown[],
): Array<{ loc: Array<string | number>; msg: string }> {
  const parsed: Array<{ loc: Array<string | number>; msg: string }> = [];

  for (const detail of details) {
    if (
      typeof detail !== "object" ||
      detail === null ||
      !("loc" in detail) ||
      !("msg" in detail) ||
      !Array.isArray(detail.loc) ||
      typeof detail.msg !== "string"
    ) {
      continue;
    }

    parsed.push({
      loc: detail.loc.filter(
        (part): part is string | number =>
          typeof part === "string" || typeof part === "number",
      ),
      msg: detail.msg,
    });
  }

  return parsed;
}

function isPolarCustomerUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isPublicHostname(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  ) {
    return false;
  }

  return !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

function readPolarCheckoutUrl(checkout: unknown): string | undefined {
  if (
    typeof checkout !== "object" ||
    checkout === null ||
    !("url" in checkout) ||
    typeof checkout.url !== "string"
  ) {
    return undefined;
  }

  return checkout.url;
}

function readPolarCustomerId(customer: unknown): string | null {
  if (
    typeof customer !== "object" ||
    customer === null ||
    !("id" in customer) ||
    typeof customer.id !== "string" ||
    customer.id.length === 0
  ) {
    return null;
  }

  return customer.id;
}

function readPolarCustomerExternalId(customer: unknown): string | null {
  if (
    typeof customer !== "object" ||
    customer === null ||
    !("externalId" in customer) ||
    typeof customer.externalId !== "string" ||
    customer.externalId.length === 0
  ) {
    return null;
  }

  return customer.externalId;
}

export function resolvePolarReturnUrl(
  url: string | undefined,
): string | undefined {
  if (url === undefined || url.trim().length === 0) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return undefined;
    }

    if (!isPublicHostname(parsed.hostname)) {
      return undefined;
    }

    return url;
  } catch {
    return undefined;
  }
}

export function readPolarPortalUrl(error: unknown): string | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("body" in error) ||
    typeof error.body !== "string"
  ) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(error.body);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "customer_portal_url" in parsed &&
      typeof parsed.customer_portal_url === "string" &&
      parsed.customer_portal_url.length > 0
    ) {
      return parsed.customer_portal_url;
    }
  } catch {
    return null;
  }

  return null;
}

export function mapPolarRequestError(error: unknown, action: string): AppError {
  if (isAppError(error)) {
    return error;
  }

  const status = polarStatusCode(error);

  if (status === 401 || status === 403) {
    return new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Polar checkout is not configured",
      cause: error,
    });
  }

  if (status === 404) {
    return new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: `Polar ${action} was not found`,
      cause: error,
    });
  }

  if (status === 422) {
    return new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: `Polar ${action} was rejected`,
      cause: error,
    });
  }

  return new AppError({
    code: APP_ERROR_CODES.INTERNAL_ERROR,
    message: `Polar ${action} failed`,
    cause: error,
  });
}

export function createPolarClient(
  options: CreatePolarClientOptions,
): PolarClient {
  const polar = new Polar({
    accessToken: options.accessToken,
    server: options.server,
  });

  return {
    async findCustomerByExternalId(externalId) {
      return fetchPolarCustomerByExternalId(options, externalId);
    },

    async createCustomer(input) {
      try {
        const customer = await polarApiJson({
          accessToken: options.accessToken,
          server: options.server,
          method: "POST",
          path: "/v1/customers",
          body: {
            type: "individual",
            email: input.email,
            external_id: input.externalId,
          },
        });
        const id = readPolarCustomerId(customer);

        if (id === null) {
          throw new AppError({
            code: APP_ERROR_CODES.INTERNAL_ERROR,
            message: "Polar customer could not be created",
          });
        }

        return { id };
      } catch (error) {
        const recovered = await recoverExistingPolarCustomer(
          polar,
          options,
          input,
          error,
        );

        if (recovered !== null) {
          return recovered;
        }

        throw mapPolarRequestError(error, "customer");
      }
    },

    async createCheckout(input) {
      const returnUrl = resolvePolarReturnUrl(input.returnUrl);

      try {
        const checkout = await polarApiJson({
          accessToken: options.accessToken,
          server: options.server,
          method: "POST",
          path: "/v1/checkouts/",
          body: {
            products: [...input.productIds],
            external_customer_id: input.externalCustomerId,
            customer_email: input.customerEmail,
            success_url: input.successUrl,
            ...(returnUrl === undefined ? {} : { return_url: returnUrl }),
          },
        });

        return {
          url: requireUrl(readPolarCheckoutUrl(checkout), "checkout"),
        };
      } catch (error) {
        throw mapPolarRequestError(error, "checkout");
      }
    },

    async updateSubscription(input) {
      try {
        await polar.subscriptions.update({
          id: input.subscriptionId,
          subscriptionUpdate: {
            productId: input.productId,
            prorationBehavior: "prorate",
          },
        });
      } catch (error) {
        throw mapPolarRequestError(error, "subscription");
      }
    },

    async createCustomerPortal(input) {
      return openPolarCustomerPortal(polar, input);
    },

    async getProduct(id) {
      try {
        return await polarApiJson({
          accessToken: options.accessToken,
          server: options.server,
          method: "GET",
          path: `/v1/products/${encodeURIComponent(id)}`,
        });
      } catch {
        return null;
      }
    },

    async listSubscriptionsByExternalId(externalId) {
      try {
        const state = await polar.customers.getStateExternal({
          externalId,
        });

        return polarSubscriptionsFromState(state, externalId);
      } catch {
        return listSubscriptionsFromPolar(polar, externalId);
      }
    },

    async listSubscriptionsByCustomerId(customerId) {
      try {
        const state = await polar.customers.getState({
          id: customerId,
        });

        return polarSubscriptionsFromState(state);
      } catch {
        return [];
      }
    },

    async listSubscriptionsByEmail(email) {
      const customer = await findPolarCustomerByEmail(polar, email);
      if (customer === null) {
        return [];
      }

      try {
        const state = await polar.customers.getState({
          id: customer.id,
        });

        return polarSubscriptionsFromState(state);
      } catch {
        return [];
      }
    },
  };
}

type PolarPortalIdentity =
  | { externalCustomerId: string; returnUrl?: string }
  | { customerId: string; returnUrl?: string };

async function openPolarCustomerPortal(
  polar: Polar,
  input: {
    externalCustomerId: string;
    customerId?: string;
    returnUrl?: string;
  },
): Promise<{ url: string }> {
  const returnUrl = resolvePolarReturnUrl(input.returnUrl);
  const identities: PolarPortalIdentity[] = [];

  if (input.customerId !== undefined && isPolarCustomerUuid(input.customerId)) {
    identities.push({ customerId: input.customerId });
  }

  identities.push({ externalCustomerId: input.externalCustomerId });

  let lastError: unknown;

  for (const identity of identities) {
    try {
      return await createPolarPortalSession(polar, {
        ...identity,
        ...(returnUrl === undefined ? {} : { returnUrl }),
      });
    } catch (error) {
      const recoveredUrl = readPolarPortalUrl(error);
      if (recoveredUrl !== null) {
        return { url: recoveredUrl };
      }

      lastError = error;
      const status = polarStatusCode(error);

      if (status === 422 && returnUrl !== undefined) {
        try {
          return await createPolarPortalSession(polar, identity);
        } catch (retryError) {
          const retryUrl = readPolarPortalUrl(retryError);
          if (retryUrl !== null) {
            return { url: retryUrl };
          }

          lastError = retryError;
        }
      }

      if (!isRetryablePolarPortalStatus(polarStatusCode(lastError))) {
        throw mapPolarRequestError(lastError, "customer portal");
      }
    }
  }

  throw new AppError({
    code: APP_ERROR_CODES.NOT_FOUND,
    message: "Polar customer portal was not found",
    cause: lastError,
  });
}

async function recoverExistingPolarCustomer(
  polar: Polar,
  options: CreatePolarClientOptions,
  input: { email: string; externalId: string },
  error: unknown,
): Promise<{ id: string } | null> {
  const status = polarStatusCode(error);

  if (status !== 409 && status !== 422) {
    return null;
  }

  const existing =
    (await fetchPolarCustomerByExternalId(options, input.externalId)) ??
    (await fetchPolarCustomerByEmail(options, input.email));

  if (existing === null) {
    return null;
  }

  if (existing.externalId !== input.externalId) {
    await linkPolarCustomerExternalId(polar, existing.id, input.externalId);
  }

  return { id: existing.id };
}

async function fetchPolarCustomerByExternalId(
  options: CreatePolarClientOptions,
  externalId: string,
): Promise<{ id: string; externalId: string | null } | null> {
  try {
    const customer = await polarApiJson({
      accessToken: options.accessToken,
      server: options.server,
      method: "GET",
      path: `/v1/customers/external/${encodeURIComponent(externalId)}`,
    });

    return toPolarCustomerRecord(customer);
  } catch {
    return null;
  }
}

async function fetchPolarCustomerByEmail(
  options: CreatePolarClientOptions,
  email: string,
): Promise<{ id: string; externalId: string | null } | null> {
  try {
    const page = await polarApiJson({
      accessToken: options.accessToken,
      server: options.server,
      method: "GET",
      path: `/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
    });

    return readPolarCustomerListItem(page);
  } catch {
    return null;
  }
}

function readPolarCustomerListItem(
  page: unknown,
): { id: string; externalId: string | null } | null {
  if (typeof page !== "object" || page === null || !("items" in page)) {
    return null;
  }

  if (!Array.isArray(page.items)) {
    return null;
  }

  return toPolarCustomerRecord(page.items[0]);
}

async function findPolarCustomerByEmail(
  polar: Polar,
  email: string,
): Promise<{ id: string; externalId: string | null } | null> {
  try {
    const page = await polar.customers.list({
      email,
      limit: 1,
    });

    for await (const result of page) {
      const customer = toPolarCustomerRecord(result.result.items[0]);
      if (customer !== null) {
        return customer;
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function linkPolarCustomerExternalId(
  polar: Polar,
  customerId: string,
  externalId: string,
): Promise<void> {
  try {
    await polar.customers.update({
      id: customerId,
      customerUpdate: { externalId },
    });
  } catch {
    // Polar does not allow changing an external id once it is set.
  }
}

function toPolarCustomerRecord(
  customer: unknown,
): { id: string; externalId: string | null } | null {
  const id = readPolarCustomerId(customer);

  if (id === null) {
    return null;
  }

  return {
    id,
    externalId: readPolarCustomerExternalId(customer),
  };
}

async function createPolarPortalSession(
  polar: Polar,
  request: PolarPortalIdentity,
): Promise<{ url: string }> {
  const session = await polar.customerSessions.create(request);
  return {
    url: requireUrl(session.customerPortalUrl, "customer portal"),
  };
}

function polarSubscriptionsFromState(
  state: {
    id: string;
    externalId?: string | null;
    activeSubscriptions: unknown[];
  },
  fallbackExternalId?: string,
): unknown[] {
  return state.activeSubscriptions.map((subscription) => ({
    ...(typeof subscription === "object" && subscription !== null
      ? subscription
      : {}),
    customerId: state.id,
    externalCustomerId: state.externalId ?? fallbackExternalId,
  }));
}

async function listSubscriptionsFromPolar(
  polar: Polar,
  externalId: string,
): Promise<unknown[]> {
  const page = await polar.subscriptions.list({
    externalCustomerId: externalId,
  });
  const items: unknown[] = [];

  for await (const result of page) {
    items.push(...result.result.items);
  }

  return items;
}
